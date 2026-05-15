import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return response({ error: "Metodo nao permitido" }, 405)

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL")
    const anonKey = requiredEnv("SUPABASE_ANON_KEY")
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    const openRouterKey = requiredEnv("OPENROUTER_API_KEY")
    const model = Deno.env.get("DEFAULT_AI_MODEL") || "openai/gpt-4o-mini"

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return response({ error: "Authorization obrigatorio" }, 401)

    const body = await req.json().catch(() => ({}))
    const topic = typeof body.topic === "string" ? body.topic.trim() : ""
    const context = typeof body.context === "string" ? body.context.trim() : ""

    if (!topic) return response({ error: "topic obrigatorio" }, 400)

    // Validate auth
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return response({ error: "Sessao invalida" }, 401)

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Get workspace context for better suggestions
    const { data: profile } = await adminClient
      .from("profiles")
      .select("workspace_id:workspace_members(workspace_id)")
      .eq("id", userData.user.id)
      .maybeSingle()

    const workspaceId = (profile as unknown as { workspace_id: Array<{ workspace_id: string }> })
      ?.workspace_id?.[0]?.workspace_id

    let marketMap = null
    if (workspaceId) {
      const { data } = await adminClient
        .from("market_maps")
        .select("niche, target_audience, main_pain, tone_of_voice")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
      marketMap = data
    }

    const systemPromptText = [
      "Voce e Deby, Diretora de Conteudo do DBE Creator.",
      "Voce sugere ganchos poderosos para Reels que vendem.",
      "Um gancho eficaz tem menos de 3 segundos, gera curiosidade imediata ou dor reconhecivel.",
      "Retorne somente JSON valido no formato: { \"hooks\": [\"gancho1\", \"gancho2\", \"gancho3\", \"gancho4\", \"gancho5\"] }",
      "Cada gancho deve ser uma frase completa, direta e no estilo de quem fala para camera.",
      "Nao use markdown, nao adicione explicacoes fora do JSON.",
    ].join("\n")

    const userPromptText = JSON.stringify({
      tarefa: "Sugira 5 ganchos poderosos para um Reel sobre o topico abaixo.",
      topico: topic,
      contexto_adicional: context || null,
      mapa_de_mercado: marketMap,
      criterios: [
        "Gere curiosidade ou mostre uma dor real nos primeiros 3 segundos",
        "Use linguagem direta, como se falasse para camera",
        "Varie os estilos: pergunta provocativa, afirmacao surpreendente, revelacao, dor direta",
        "Evite cliches como 'Voce sabia que' sem impacto real",
      ],
    })

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("APP_URL") || "http://localhost:5173",
        "X-Title": "DBE Creator",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPromptText },
          { role: "user", content: userPromptText },
        ],
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      throw new Error(`OpenRouter error ${res.status}: ${details.slice(0, 500)}`)
    }

    const payload = await res.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content || typeof content !== "string") throw new Error("OpenRouter retornou conteudo vazio")

    const parsed = JSON.parse(extractJson(content))
    const hooks = Array.isArray(parsed.hooks) ? parsed.hooks.filter((h: unknown) => typeof h === "string") : []

    return response({ hooks })
  } catch (error) {
    console.error("[deby-suggest-hook]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel gerar sugestoes de gancho" }, 500)
  }
})

function extractJson(content: string) {
  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON ausente na resposta da IA")
  return content.slice(start, end + 1)
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
