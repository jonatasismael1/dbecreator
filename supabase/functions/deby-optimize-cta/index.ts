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
    const openRouterKey = requiredEnv("OPENROUTER_API_KEY")
    const model = Deno.env.get("DEFAULT_AI_MODEL") || "openai/gpt-4o-mini"

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return response({ error: "Authorization obrigatorio" }, 401)

    const body = await req.json().catch(() => ({}))
    const cta_text = typeof body.cta_text === "string" ? body.cta_text.trim() : ""
    const goal = typeof body.goal === "string" ? body.goal.trim() : ""

    if (!cta_text) return response({ error: "cta_text obrigatorio" }, 400)

    // Validate auth
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return response({ error: "Sessao invalida" }, 401)

    const systemPromptText = [
      "Voce e Deby, Diretora de Conteudo do DBE Creator.",
      "Voce otimiza CTAs de Reels para maximizar conversao.",
      "Um CTA eficaz tem uma unica acao clara, direta e alinhada ao objetivo do criador.",
      "Retorne somente JSON valido no formato: { \"optimized_cta\": \"texto\", \"explanation\": \"explicacao\" }",
      "Nao use markdown, nao adicione texto fora do JSON.",
    ].join("\n")

    const userPromptText = JSON.stringify({
      tarefa: "Otimize este CTA para maximizar conversao em um Reel.",
      cta_original: cta_text,
      objetivo_do_roteiro: goal || "Nao especificado",
      criterios: [
        "Uma unica chamada para acao, sem ambiguidade",
        "Linguagem direta, no tempo imperativo",
        "Especifico sobre o que o espectador deve fazer agora",
        "Alinhado ao objetivo do roteiro",
        "Maximo 2 frases curtas",
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
        temperature: 0.3,
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

    return response({
      optimized_cta: typeof parsed.optimized_cta === "string" ? parsed.optimized_cta : "",
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
    })
  } catch (error) {
    console.error("[deby-optimize-cta]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel otimizar o CTA" }, 500)
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
