import "jsr:@supabase/functions-js/edge-runtime.d.ts"
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

type MarketMapInsights = {
  positioning_summary: string
  audience_insights: string[]
  content_opportunities: string[]
  pillar_recommendations: string[]
  risks: string[]
  next_actions: string[]
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return response({ error: "Metodo nao permitido" }, 405)

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL")
    const anonKey = requiredEnv("SUPABASE_ANON_KEY")
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY")
    const model = normalizeModel(Deno.env.get("DEFAULT_AI_MODEL"))

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return response({ error: "Authorization obrigatorio" }, 401)

    const { workspace_id } = await req.json().catch(() => ({ workspace_id: null }))
    if (!workspace_id || typeof workspace_id !== "string") {
      return response({ error: "workspace_id obrigatorio" }, 400)
    }

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
      .eq("workspace_id", workspace_id)
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership) return response({ error: "Acesso negado" }, 403)

    const [{ data: marketMap, error: mapError }, { data: pillars }, { data: scripts }] = await Promise.all([
      adminClient
        .from("market_maps")
        .select("id, workspace_id, niche, target_audience, main_pain, competitors, differentiators, tone_of_voice, is_complete")
        .eq("workspace_id", workspace_id)
        .maybeSingle(),
      adminClient
        .from("content_pillars")
        .select("title, description, type, is_active, position")
        .eq("workspace_id", workspace_id)
        .order("position", { ascending: true }),
      adminClient
        .from("scripts")
        .select("title, hook, body, cta, status, last_analysis_score")
        .eq("workspace_id", workspace_id)
        .order("updated_at", { ascending: false })
        .limit(20),
    ])

    if (mapError) throw mapError
    if (!marketMap) return response({ error: "Mapa de mercado nao encontrado" }, 404)

    const insights = openRouterKey
      ? await analyzeWithDeby({
          openRouterKey,
          model,
          marketMap,
          pillars: pillars ?? [],
          scripts: scripts ?? [],
        }).catch((error) => {
          console.error("[analyze-market-map:ai-fallback]", error instanceof Error ? error.message : error)
          return buildFallbackInsights(marketMap, pillars ?? [], scripts ?? [])
        })
      : buildFallbackInsights(marketMap, pillars ?? [], scripts ?? [])

    const { error: updateError } = await adminClient
      .from("market_maps")
      .update({
        deby_insights: insights,
        last_insights_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", marketMap.id)

    if (updateError) throw updateError

    return response({ insights })
  } catch (error) {
    console.error("[analyze-market-map]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel analisar o mapa de mercado" }, 500)
  }
})

async function analyzeWithDeby(params: {
  openRouterKey: string
  model: string
  marketMap: Record<string, unknown>
  pillars: Array<Record<string, unknown>>
  scripts: Array<Record<string, unknown>>
}): Promise<MarketMapInsights> {
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
        { role: "user", content: userPrompt(params.marketMap, params.pillars, params.scripts) },
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

  return normalizeInsights(JSON.parse(extractJson(content)))
}

function systemPrompt() {
  return [
    "Voce e Deby, Diretora de Conteudo do DBE Creator.",
    "Analise mapa de mercado, pilares e roteiros como uma estrategista critica de Reels que vendem.",
    "Nao seja generica. Aponte lacunas, oportunidades de posicionamento e proximas acoes praticas.",
    "Responda somente JSON valido, sem markdown.",
    "Schema obrigatorio: positioning_summary string, audience_insights string[], content_opportunities string[], pillar_recommendations string[], risks string[], next_actions string[].",
  ].join("\n")
}

function userPrompt(
  marketMap: Record<string, unknown>,
  pillars: Array<Record<string, unknown>>,
  scripts: Array<Record<string, unknown>>,
) {
  return JSON.stringify({
    tarefa: "Gerar insights estrategicos depois da conclusao do mapa de mercado.",
    mapa_de_mercado: marketMap,
    pilares: pillars,
    roteiros_recentes: scripts,
  })
}

function normalizeInsights(value: Record<string, unknown>): MarketMapInsights {
  return {
    positioning_summary: asString(value.positioning_summary),
    audience_insights: asStringArray(value.audience_insights),
    content_opportunities: asStringArray(value.content_opportunities),
    pillar_recommendations: asStringArray(value.pillar_recommendations),
    risks: asStringArray(value.risks),
    next_actions: asStringArray(value.next_actions),
  }
}

function buildFallbackInsights(
  marketMap: Record<string, unknown>,
  pillars: Array<Record<string, unknown>>,
  scripts: Array<Record<string, unknown>>,
): MarketMapInsights {
  const niche = asString(marketMap.niche) || "seu nicho"
  const audience = asString(marketMap.target_audience)
  const pain = asString(marketMap.main_pain)
  const differentiators = asString(marketMap.differentiators)
  const tone = asString(marketMap.tone_of_voice)
  const competitors = Array.isArray(marketMap.competitors) ? marketMap.competitors : []
  const readyScripts = scripts.filter((script) => script.status === "ready" || script.status === "recorded")

  return {
    positioning_summary: [
      `Seu posicionamento em ${niche} precisa conectar uma dor especifica a uma promessa mensuravel.`,
      differentiators ? `O diferencial mais forte a transformar em narrativa e: ${differentiators}.` : "Ainda falta explicitar um diferencial defensavel para nao competir por conteudo generico.",
      tone ? `O tom ${tone} deve aparecer no gancho e no CTA, nao apenas na descricao da marca.` : "",
    ].filter(Boolean).join(" "),
    audience_insights: [
      audience ? `O publico descrito deve ser segmentado em situacoes de compra: quem esta consciente da dor, quem compara solucoes e quem ja quer executar.` : "Detalhe melhor o publico com contexto de vida, objecoes e nivel de consciencia.",
      pain ? `A dor central para parar o scroll e: ${pain}. Transforme essa dor em frases que a pessoa diria em voz alta.` : "A dor principal ainda esta fraca ou ausente; sem ela a Deby tera pouca base para criticar roteiros.",
      competitors.length ? `Voce mapeou ${competitors.length} concorrente(s); use isso para criar conteudos de contraste, nao copia de pauta.` : "Mapeie pelo menos 3 concorrentes para revelar brechas de posicionamento.",
    ],
    content_opportunities: [
      `Crie uma serie de Reels sobre erros caros dentro de ${niche}, sempre ligando erro -> consequencia -> proximo passo.`,
      "Use provas, bastidores e exemplos reais para tornar a promessa mais concreta.",
      readyScripts.length ? `Revise os ${readyScripts.length} roteiro(s) pronto(s) contra este mapa e procure ganchos que nao mencionam dor ou desejo claro.` : "Transforme o mapa em 5 roteiros iniciais antes de abrir novas frentes.",
    ],
    pillar_recommendations: [
      pillars.length ? `Mantenha ${Math.min(pillars.length, 4)} pilares ativos no maximo para evitar dispersao editorial.` : "Crie pilares de autoridade, educacao, conexao e venda antes de escalar a producao.",
      "Todo pilar precisa ter uma funcao comercial clara: atrair, educar, quebrar objecao ou converter.",
      "Separe conteudos de desejo dos conteudos de prova; misturar os dois enfraquece a mensagem.",
    ],
    risks: [
      "Falar com publico amplo demais reduz conversao e deixa os roteiros parecidos com conteudo comum.",
      "Diferenciais sem prova viram promessa vazia; cada diferencial precisa de exemplo, dado ou historia.",
      "CTAs genericos como 'me siga' devem ser substituidos por acoes alinhadas ao funil.",
    ],
    next_actions: [
      "Reescreva sua promessa principal em uma frase curta: eu ajudo [publico] a conquistar [resultado] sem [objecao].",
      "Crie 10 ganchos usando literalmente a dor principal do mapa.",
      "Associe cada roteiro novo a um pilar e a uma etapa do funil antes de publicar.",
      "Depois de publicar, compare salvamentos e compartilhamentos por pilar no relatorio.",
    ],
  }
}

function normalizeModel(value: string | undefined | null) {
  if (!value || value === "openrouter/free") return "openai/gpt-4o-mini"
  return value
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
