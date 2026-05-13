import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
}

type DebyResult = {
  score: number
  classification: string
  diagnosis: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  improved_hook: string
  improved_cta: string
  rewritten_script: string
  pillar_suggestion: string
  conversion_risk: string
  alignment_warning: string | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return response({ error: "Metodo nao permitido" }, 405)
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL")
    const anonKey = requiredEnv("SUPABASE_ANON_KEY")
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    const openRouterKey = requiredEnv("OPENROUTER_API_KEY")
    const model = Deno.env.get("DEFAULT_AI_MODEL") || "openai/gpt-4o-mini"

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return response({ error: "Authorization obrigatorio" }, 401)
    }

    const { script_id } = await req.json().catch(() => ({ script_id: null }))
    if (!script_id || typeof script_id !== "string") {
      return response({ error: "script_id obrigatorio" }, 400)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      return response({ error: "Sessao invalida" }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: script, error: scriptError } = await adminClient
      .from("scripts")
      .select("id, workspace_id, title, hook, body, cta, status, content_pillar_id, content_pillars(title, description, type)")
      .eq("id", script_id)
      .maybeSingle()

    if (scriptError) throw scriptError
    if (!script) return response({ error: "Roteiro nao encontrado" }, 404)

    const { data: membership, error: membershipError } = await adminClient
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", script.workspace_id)
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership) return response({ error: "Acesso negado" }, 403)

    const [{ data: marketMap }, { data: pillars }] = await Promise.all([
      adminClient
        .from("market_maps")
        .select("niche, target_audience, main_pain, differentiators, tone_of_voice")
        .eq("workspace_id", script.workspace_id)
        .maybeSingle(),
      adminClient
        .from("content_pillars")
        .select("title, description, type")
        .eq("workspace_id", script.workspace_id)
        .eq("is_active", true)
        .order("position", { ascending: true }),
    ])

    const result = await analyzeWithDeby({
      openRouterKey,
      model,
      script,
      marketMap,
      pillars: pillars ?? [],
    })

    const { data: analysis, error: insertError } = await adminClient
      .from("ai_analyses")
      .insert({
        workspace_id: script.workspace_id,
        script_id: script.id,
        model,
        result,
        created_by: userData.user.id,
      })
      .select("id, workspace_id, script_id, model, result, created_at")
      .single()

    if (insertError) throw insertError

    await adminClient
      .from("scripts")
      .update({ last_analysis_score: result.score, updated_at: new Date().toISOString() })
      .eq("id", script.id)

    return response({ analysis })
  } catch (error) {
    console.error("[analyze-script]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel analisar o roteiro" }, 500)
  }
})

async function analyzeWithDeby(params: {
  openRouterKey: string
  model: string
  script: Record<string, unknown>
  marketMap: Record<string, unknown> | null
  pillars: Array<Record<string, unknown>>
}): Promise<DebyResult> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${params.openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("APP_URL") || "http://localhost:5173",
      "X-Title": "DBE Creator",
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(params.script, params.marketMap, params.pillars) },
      ],
    }),
  })

  if (!res.ok) {
    const details = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${details.slice(0, 500)}`)
  }

  const payload = await res.json()
  const content = payload?.choices?.[0]?.message?.content
  if (!content || typeof content !== "string") {
    throw new Error("OpenRouter retornou conteudo vazio")
  }

  return normalizeDebyResult(JSON.parse(extractJson(content)))
}

function systemPrompt() {
  return [
    "Voce e Deby, Diretora de Conteudo do DBE Creator.",
    "Voce nao e chatbot de suporte. Voce e critica, tecnica, estrategica e direta.",
    "Avalie roteiros de Reels que precisam vender, reter atencao e alinhar com pilares de conteudo.",
    "Responda somente JSON valido, sem markdown, exatamente com as chaves solicitadas.",
    "Schema obrigatorio: score number de 0 a 10 com uma casa decimal quando necessario, classification string, diagnosis string, strengths string[], weaknesses string[], suggestions string[], improved_hook string, improved_cta string, rewritten_script string, pillar_suggestion string, conversion_risk string, alignment_warning string|null.",
  ].join("\n")
}

function userPrompt(
  script: Record<string, unknown>,
  marketMap: Record<string, unknown> | null,
  pillars: Array<Record<string, unknown>>,
) {
  return JSON.stringify({
    tarefa: "Analise este roteiro como Diretora de Conteudo.",
    criterios: [
      "Gancho forte o suficiente para parar o scroll",
      "Clareza da dor",
      "Promessa clara e desejavel",
      "Especificidade sem termos genericos",
      "CTA unico e direcionado",
      "Alinhamento com os pilares de conteudo",
    ],
    roteiro: script,
    mapa_de_mercado: marketMap,
    pilares_ativos: pillars,
  })
}

function normalizeDebyResult(value: Record<string, unknown>): DebyResult {
  const rawScore = Number(value.score ?? 0)
  const normalizedScore = rawScore > 10 ? rawScore / 10 : rawScore
  const score = Math.round(Math.max(0, Math.min(10, normalizedScore)) * 10) / 10
  return {
    score,
    classification: classify(score),
    diagnosis: asString(value.diagnosis),
    strengths: asStringArray(value.strengths),
    weaknesses: asStringArray(value.weaknesses),
    suggestions: asStringArray(value.suggestions),
    improved_hook: asString(value.improved_hook),
    improved_cta: asString(value.improved_cta),
    rewritten_script: asString(value.rewritten_script),
    pillar_suggestion: asString(value.pillar_suggestion),
    conversion_risk: asString(value.conversion_risk),
    alignment_warning: value.alignment_warning === null ? null : asString(value.alignment_warning),
  }
}

function classify(score: number) {
  if (score < 4) return "Fraco"
  if (score < 6) return "Razoavel"
  if (score < 7.5) return "Bom"
  if (score < 9) return "Forte"
  return "Excelente"
}

function extractJson(content: string) {
  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON ausente na resposta da IA")
  return content.slice(start, end + 1)
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
