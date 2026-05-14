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

type WizardSuggestion = {
  target_audience: string
  main_pain: string
  competitors: Array<{ name: string; strength: string }>
  differentiators: string
  tone_of_voice: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return response({ error: "Metodo nao permitido" }, 405)

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL")
    const anonKey = requiredEnv("SUPABASE_ANON_KEY")
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY")
    const model = Deno.env.get("DEFAULT_AI_MODEL") || "openai/gpt-4o-mini"
    const authHeader = req.headers.get("Authorization")

    if (!authHeader) return response({ error: "Authorization obrigatorio" }, 401)

    const body = await req.json().catch(() => ({}))
    const niche = typeof body?.niche === "string" ? body.niche.trim() : ""
    const workspaceId = typeof body?.workspace_id === "string" ? body.workspace_id.trim() : ""
    if (niche.length < 3) return response({ error: "Nicho obrigatorio" }, 400)
    if (!workspaceId) return response({ error: "workspace_id obrigatorio" }, 400)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return response({ error: "Sessao invalida" }, 401)

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: membership, error: membershipError } = await adminClient
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership) return response({ error: "Acesso negado" }, 403)

    const suggestions = openRouterKey
      ? await generateWithDeby({ openRouterKey, model, niche })
      : fallbackSuggestion(niche)

    return response({ suggestions })
  } catch {
    return response({
      error: "Nao foi possivel gerar sugestoes para o mapa de mercado",
      suggestions: fallbackSuggestion("seu nicho"),
    }, 500)
  }
})

async function generateWithDeby(params: {
  openRouterKey: string
  model: string
  niche: string
}): Promise<WizardSuggestion> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${params.openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("APP_URL") || "http://localhost:5173",
        "X-Title": "DBE Creator",
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: JSON.stringify({ niche: params.niche }) },
        ],
      }),
    })

    if (!res.ok) throw new Error(`OpenRouter error ${res.status}`)
    const payload = await res.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content || typeof content !== "string") throw new Error("Resposta vazia")

    return normalizeSuggestion(JSON.parse(extractJson(content)), params.niche)
  } finally {
    clearTimeout(timeout)
  }
}

function systemPrompt() {
  return [
    "Voce e Deby, Diretora de Conteudo do DBE Creator.",
    "Preencha um Mapa de Mercado para criadores de conteudo e negocios que vendem por Reels.",
    "Seja estrategica, especifica e objetiva. Evite termos genericos.",
    "Responda somente JSON valido com as chaves: target_audience string, main_pain string, competitors array de objetos {name, strength}, differentiators string, tone_of_voice string.",
  ].join("\n")
}

function normalizeSuggestion(value: Record<string, unknown>, niche: string): WizardSuggestion {
  return {
    target_audience: asString(value.target_audience) || `Pessoas que buscam uma solucao clara em ${niche} e precisam confiar antes de comprar.`,
    main_pain: asString(value.main_pain) || `O publico ainda nao entende por que as solucoes comuns de ${niche} nao funcionam para sua realidade.`,
    competitors: asCompetitors(value.competitors),
    differentiators: asString(value.differentiators) || `Posicionamento especifico, provas concretas e conteudo que conecta dor, metodo e proximo passo.`,
    tone_of_voice: asString(value.tone_of_voice) || "Direto, tecnico, humano e estrategico.",
  }
}

function fallbackSuggestion(niche: string): WizardSuggestion {
  return normalizeSuggestion({}, niche)
}

function asCompetitors(value: unknown): Array<{ name: string; strength: string }> {
  if (!Array.isArray(value)) {
    return [
      { name: "Concorrente educativo", strength: "Explica bem o problema e cria autoridade." },
      { name: "Concorrente aspiracional", strength: "Usa provas sociais e transformacoes desejadas." },
      { name: "Concorrente de oferta", strength: "Comunica promessas e chamadas para acao com frequencia." },
    ]
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const record = item as Record<string, unknown>
      return { name: asString(record.name), strength: asString(record.strength) }
    })
    .filter((item): item is { name: string; strength: string } => Boolean(item?.name))
    .slice(0, 3)
}

function extractJson(content: string) {
  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON ausente")
  return content.slice(start, end + 1)
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
