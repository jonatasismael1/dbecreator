import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const META_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v25.0"
const META_BASE_URL = `https://graph.facebook.com/${META_VERSION}`

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
}

type MetaMetric = {
  name: string
  values?: Array<{ value: number | Record<string, number> }>
}

type InstagramMedia = {
  id: string
  caption?: string
  media_type?: string
  media_product_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return response({ error: "Metodo nao permitido" }, 405)

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL")
    const anonKey = requiredEnv("SUPABASE_ANON_KEY")
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return response({ error: "Authorization obrigatorio" }, 401)

    const { workspace_id, limit = 50 } = await req.json().catch(() => ({ workspace_id: null }))
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

    const { data: integration, error: integrationError } = await adminClient
      .from("workspace_integrations")
      .select("access_token, account_id, account_name")
      .eq("workspace_id", workspace_id)
      .eq("platform", "instagram")
      .eq("status", "connected")
      .maybeSingle()

    if (integrationError) throw integrationError
    if (!integration?.access_token) {
      return response({ error: "Instagram nao conectado para este workspace." }, 400)
    }

    const discoveredAccount = await discoverInstagramAccount(integration.access_token, integration.account_id)
    const igAccountId = discoveredAccount.id

    if (discoveredAccount.id !== integration.account_id || discoveredAccount.username !== integration.account_name) {
      await adminClient
        .from("workspace_integrations")
        .update({
          account_id: discoveredAccount.id,
          account_name: discoveredAccount.username,
          metadata: {
            source: discoveredAccount.source,
            graph_version: META_VERSION,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspace_id)
        .eq("platform", "instagram")
    }

    const media = await fetchInstagramMedia(igAccountId, integration.access_token, Math.min(Number(limit) || 50, 100))
    const synced = []

    for (const item of media) {
      const insights = await fetchMediaInsights(item.id, integration.access_token)
      const metrics = normalizeMetrics(item, insights)

      const { data: metricRow, error: upsertError } = await adminClient
        .from("performance_metrics")
        .upsert({
          workspace_id,
          script_id: null,
          platform: "instagram",
          external_media_id: item.id,
          external_permalink: item.permalink ?? null,
          caption: item.caption ?? null,
          thumbnail_url: item.thumbnail_url ?? item.media_url ?? null,
          media_type: item.media_product_type ?? item.media_type ?? null,
          account_id: igAccountId,
          published_at: item.timestamp ?? new Date().toISOString(),
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          watch_time_seconds: metrics.watch_time_seconds,
          retention_rate: metrics.retention_rate,
          link_clicks: 0,
          raw_insights: insights,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userData.user.id,
        }, { onConflict: "workspace_id,platform,external_media_id" })
        .select("id, script_id")
        .single()

      if (upsertError) throw upsertError

      synced.push({
        id: item.id,
        metric_id: metricRow.id,
        script_id: metricRow.script_id,
        caption: item.caption,
        media_type: item.media_product_type ?? item.media_type ?? "UNKNOWN",
        media_url: item.media_url,
        thumbnail_url: item.thumbnail_url ?? item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
        metrics,
        raw_insights: insights,
      })
    }

    return response({ media: synced, account: discoveredAccount, synced_count: synced.length })
  } catch (error) {
    console.error("[sync-instagram-metrics]", error instanceof Error ? error.message : error)
    return response({ error: error instanceof Error ? error.message : "Nao foi possivel sincronizar Instagram" }, 500)
  }
})

async function discoverInstagramAccount(token: string, existingAccountId?: string | null) {
  const appId = Deno.env.get("META_APP_ID")
  const isKnownPlaceholder = existingAccountId === "1374533250628298" || (appId ? existingAccountId === appId : false)
  if (existingAccountId && !isKnownPlaceholder) {
    const existing = await metaGet(`/${existingAccountId}`, token, "fields=id,username")
    if (existing.ok && existing.data?.id) {
      return { id: String(existing.data.id), username: String(existing.data.username ?? existingAccountId), source: "saved_account_id" }
    }
  }

  const pages = await metaGet("/me/accounts", token, "fields=id,name,instagram_business_account{id,username}")
  if (pages.ok) {
    const pageWithInstagram = pages.data?.data?.find((page: any) => page.instagram_business_account?.id)
    if (pageWithInstagram) {
      return {
        id: String(pageWithInstagram.instagram_business_account.id),
        username: String(pageWithInstagram.instagram_business_account.username ?? pageWithInstagram.name ?? "Instagram"),
        source: "facebook_page",
      }
    }
  }

  const me = await metaGet("/me", token, "fields=id,username,name")
  if (me.ok && me.data?.id) {
    return {
      id: String(me.data.id),
      username: String(me.data.username ?? me.data.name ?? "Instagram"),
      source: "direct_user",
    }
  }

  throw new Error("Nao foi possivel localizar uma conta Instagram Business/Creator para este token.")
}

async function fetchInstagramMedia(igAccountId: string, token: string, limit: number): Promise<InstagramMedia[]> {
  const fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
  const media = await metaGet(`/${igAccountId}/media`, token, `fields=${fields}&limit=${limit}`)
  if (!media.ok) throw new Error(`Erro na API do Meta ao buscar midias: ${media.error}`)
  return media.data?.data ?? []
}

async function fetchMediaInsights(mediaId: string, token: string) {
  const metrics = ["views", "reach", "saved", "shares", "total_interactions", "plays", "impressions"]
  const results: Record<string, number> = {}
  const unavailable: string[] = []

  await Promise.all(metrics.map(async (metric) => {
    const res = await metaGet(`/${mediaId}/insights`, token, `metric=${metric}`)
    if (!res.ok) {
      unavailable.push(metric)
      return
    }

    for (const item of (res.data?.data ?? []) as MetaMetric[]) {
      const value = item.values?.[0]?.value
      results[item.name] = typeof value === "number" ? value : sumRecord(value)
    }
  }))

  return { metrics: results, unavailable_metrics: unavailable }
}

function normalizeMetrics(media: InstagramMedia, insights: { metrics: Record<string, number>; unavailable_metrics: string[] }) {
  const views = firstNumber(insights.metrics.views, insights.metrics.plays, insights.metrics.impressions, insights.metrics.reach)
  const watchTime = firstNumber(insights.metrics.ig_reels_avg_watch_time, insights.metrics.avg_watch_time)
  return {
    views,
    likes: media.like_count ?? firstNumber(insights.metrics.likes),
    comments: media.comments_count ?? firstNumber(insights.metrics.comments),
    shares: firstNumber(insights.metrics.shares),
    saves: firstNumber(insights.metrics.saved, insights.metrics.saves),
    watch_time_seconds: watchTime,
    retention_rate: 0,
  }
}

async function metaGet(path: string, token: string, query: string) {
  const separator = query ? `?${query}&` : "?"
  const res = await fetch(`${META_BASE_URL}${path}${separator}access_token=${encodeURIComponent(token)}`)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    return { ok: false, data: null, error: data?.error?.message ?? text }
  }
  return { ok: true, data, error: null }
}

function sumRecord(value: unknown) {
  if (!value || typeof value !== "object") return 0
  return Object.values(value as Record<string, unknown>).reduce((sum, item) => sum + (typeof item === "number" ? item : 0), 0)
}

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? 0
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
