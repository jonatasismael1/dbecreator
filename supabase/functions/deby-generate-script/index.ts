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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return response({ error: "Sessao invalida" }, 401)

    const body = await req.json().catch(() => ({}))
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
    if (!prompt) return response({ error: "prompt obrigatorio" }, 400)

    const systemPrompt = `Voce e Deby, Diretora de Conteudo especialista em Reels que vendem. 
Com base no prompt do usuario, gere uma estrutura completa de roteiro estrategico para Reels.
Retorne SOMENTE um JSON valido com exatamente este formato:
{
  "title": "titulo do roteiro (maximo 80 caracteres)",
  "pillar_suggestion": "sugestao de pilar (Autoridade, Venda, Conexao ou Educacao)",
  "hook": "gancho de abertura impactante (primeiros 3 segundos, gera curiosidade ou emocao)",
  "body": "desenvolvimento do roteiro (contexto, argumento principal, prova social ou dado)",
  "cta": "chamada para acao clara e direta (unica acao para o espectador)"
}
Seja direto, tecnico e estrategico. Use linguagem persuasiva voltada para conversao.`

    const userMessage = `Crie um roteiro com base nesta ideia:\n\n${prompt}`

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenRouter error ${res.status}: ${(await res.text()).slice(0, 300)}`)
    }

    const payload = await res.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error("OpenRouter retornou conteudo vazio")

    const parsed = JSON.parse(extractJson(content))

    const script = {
      title: String(parsed.title || "").slice(0, 80),
      pillar_suggestion: String(parsed.pillar_suggestion || ""),
      hook: String(parsed.hook || ""),
      body: String(parsed.body || ""),
      cta: String(parsed.cta || ""),
    }

    if (!script.title || !script.hook || !script.body || !script.cta) {
      throw new Error("Roteiro gerado incompleto")
    }

    return response({ script })
  } catch (error) {
    console.error("[deby-generate-script]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel gerar o roteiro" }, 500)
  }
})

function extractJson(content: string) {
  const s = content.indexOf("{")
  const e = content.lastIndexOf("}")
  if (s === -1 || e <= s) throw new Error("JSON ausente na resposta")
  return content.slice(s, e + 1)
}

function requiredEnv(name: string) {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Env ausente: ${name}`)
  return v
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
