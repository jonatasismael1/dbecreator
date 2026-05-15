import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" }

interface IdeaItem { title: string; hook_suggestion: string; pillar: string }

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
    const pillar_id = typeof body.pillar_id === "string" ? body.pillar_id.trim() : ""
    const pillar_name = typeof body.pillar_name === "string" ? body.pillar_name.trim() : ""
    const count = typeof body.count === "number" ? Math.min(Math.max(body.count, 1), 10) : 5
    if (!pillar_id && !pillar_name) return response({ error: "pillar_id ou pillar_name obrigatorio" }, 400)
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return response({ error: "Sessao invalida" }, 401)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    let pillarData: Record<string, unknown> | null = null
    let marketMap: Record<string, unknown> | null = null
    if (pillar_id) {
      const { data: p } = await adminClient.from("content_pillars").select("id,title,description,type,workspace_id").eq("id", pillar_id).maybeSingle()
      pillarData = p
      if (p?.workspace_id) {
        const { data: mm } = await adminClient.from("market_maps").select("niche,target_audience,main_pain,tone_of_voice").eq("workspace_id", p.workspace_id).maybeSingle()
        marketMap = mm
      }
    }
    const resolvedPillarName = (pillarData?.title as string) || pillar_name
    const sys = "Voce e Deby, Diretora de Conteudo do DBE Creator. Gere ideias estrategicas para Reels. Retorne somente JSON: { \"ideas\": [{ \"title\": \"titulo\", \"hook_suggestion\": \"gancho\", \"pillar\": \"pilar\" }] }"
    const usr = JSON.stringify({ tarefa: `Gere ${count} ideias para o pilar abaixo.`, pilar: { nome: resolvedPillarName, descricao: pillarData?.description || null, tipo: pillarData?.type || null }, mapa_de_mercado: marketMap })
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json", "HTTP-Referer": Deno.env.get("APP_URL") || "http://localhost:5173", "X-Title": "DBE Creator" },
      body: JSON.stringify({ model, temperature: 0.6, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
    })
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const payload = await res.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error("OpenRouter retornou conteudo vazio")
    const parsed = JSON.parse(extractJson(content))
    const ideas: IdeaItem[] = Array.isArray(parsed.ideas)
      ? parsed.ideas.filter((i: unknown) => typeof i === "object" && i !== null).map((i: Record<string, unknown>) => ({ title: String(i.title || ""), hook_suggestion: String(i.hook_suggestion || ""), pillar: String(i.pillar || resolvedPillarName) })).filter((i: IdeaItem) => i.title)
      : []
    return response({ ideas })
  } catch (error) {
    console.error("[deby-generate-ideas]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel gerar ideias" }, 500)
  }
})

function extractJson(content: string) { const s = content.indexOf("{"); const e = content.lastIndexOf("}"); if (s === -1 || e <= s) throw new Error("JSON ausente"); return content.slice(s, e + 1) }
function requiredEnv(name: string) { const v = Deno.env.get(name); if (!v) throw new Error(`Env ausente: ${name}`); return v }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: jsonHeaders }) }
