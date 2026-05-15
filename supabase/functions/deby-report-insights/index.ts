import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" }

interface Insight { insight_text: string; recommendation_text: string }

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
    const workspace_id = typeof body.workspace_id === "string" ? body.workspace_id.trim() : ""
    if (!workspace_id) return response({ error: "workspace_id obrigatorio" }, 400)
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return response({ error: "Sessao invalida" }, 401)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    // Validate membership
    const { data: membership } = await adminClient.from("workspace_members").select("role").eq("workspace_id", workspace_id).eq("user_id", userData.user.id).maybeSingle()
    if (!membership) return response({ error: "Acesso negado" }, 403)
    // Gather data
    const [{ data: metrics }, { data: scripts }, { data: pillars }, { data: marketMap }] = await Promise.all([
      adminClient.from("performance_metrics").select("platform,views,likes,comments,shares,saves,script_id,published_at").eq("workspace_id", workspace_id).order("published_at", { ascending: false }).limit(30),
      adminClient.from("scripts").select("id,title,status,content_pillar_id,last_analysis_score").eq("workspace_id", workspace_id).is("archived_at", null).order("created_at", { ascending: false }).limit(20),
      adminClient.from("content_pillars").select("id,title,type").eq("workspace_id", workspace_id).eq("is_active", true),
      adminClient.from("market_maps").select("niche,target_audience,main_pain,tone_of_voice").eq("workspace_id", workspace_id).maybeSingle(),
    ])
    const snapshot = { metrics: metrics || [], scripts: scripts || [], pillars: pillars || [], marketMap }
    const sys = [
      "Voce e Deby, Diretora de Conteudo do DBE Creator.",
      "Analise os dados de performance e gere insights estrategicos acionaveis.",
      "Retorne somente JSON: { \"insights\": [{ \"insight_text\": \"insight\", \"recommendation_text\": \"recomendacao\" }] }",
      "Gere entre 3 e 5 insights. Cada insight deve ser especifico, com dado concreto e recomendacao clara.",
    ].join("\n")
    const usr = JSON.stringify({ tarefa: "Analise estes dados de performance e gere insights estrategicos.", dados: snapshot })
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json", "HTTP-Referer": Deno.env.get("APP_URL") || "http://localhost:5173", "X-Title": "DBE Creator" },
      body: JSON.stringify({ model, temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
    })
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const payload = await res.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error("OpenRouter retornou conteudo vazio")
    const parsed = JSON.parse(extractJson(content))
    const insights: Insight[] = Array.isArray(parsed.insights)
      ? parsed.insights.filter((i: unknown) => typeof i === "object" && i !== null).map((i: Record<string, unknown>) => ({ insight_text: String(i.insight_text || ""), recommendation_text: String(i.recommendation_text || "") })).filter((i: Insight) => i.insight_text)
      : []
    // Persist insights (delete old, insert new)
    await adminClient.from("report_insights").delete().eq("workspace_id", workspace_id)
    if (insights.length > 0) {
      await adminClient.from("report_insights").insert(insights.map((i) => ({ workspace_id, ...i, data_snapshot: snapshot })))
    }
    const { data: saved } = await adminClient.from("report_insights").select("*").eq("workspace_id", workspace_id).order("created_at", { ascending: true })
    return response({ insights: saved || insights })
  } catch (error) {
    console.error("[deby-report-insights]", error instanceof Error ? error.message : error)
    return response({ error: "Nao foi possivel gerar insights" }, 500)
  }
})

function extractJson(content: string) { const s = content.indexOf("{"); const e = content.lastIndexOf("}"); if (s === -1 || e <= s) throw new Error("JSON ausente"); return content.slice(s, e + 1) }
function requiredEnv(name: string) { const v = Deno.env.get(name); if (!v) throw new Error(`Env ausente: ${name}`); return v }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: jsonHeaders }) }
