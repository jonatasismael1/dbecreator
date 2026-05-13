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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return response({ error: "Metodo nao permitido" }, 405)

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL")
    const anonKey = requiredEnv("SUPABASE_ANON_KEY")
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    const authHeader = req.headers.get("Authorization")

    if (!authHeader) return response({ error: "Authorization obrigatorio" }, 401)

    const {
      workspace_id,
      code,
      redirect_uri,
      access_token,
    } = await req.json().catch(() => ({ workspace_id: null, code: null, redirect_uri: null, access_token: null }))
    if (!workspace_id || typeof workspace_id !== "string") return response({ error: "workspace_id obrigatorio" }, 400)
    if ((!code || typeof code !== "string") && (!access_token || typeof access_token !== "string")) {
      return response({ error: "code OAuth ou access_token obrigatorio" }, 400)
    }
    if (code && (!redirect_uri || typeof redirect_uri !== "string")) {
      return response({ error: "redirect_uri obrigatorio" }, 400)
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
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return response({ error: "Apenas owner/admin pode conectar Instagram." }, 403)
    }

    const resolvedToken = code
      ? await exchangeCodeForLongLivedToken(code, redirect_uri)
      : access_token

    const account = await discoverInstagramAccount(resolvedToken)

    const { data: integration, error: upsertError } = await adminClient
      .from("workspace_integrations")
      .upsert({
        workspace_id,
        platform: "instagram",
        access_token: resolvedToken,
        account_id: account.id,
        account_name: account.username,
        status: "connected",
        metadata: {
          source: account.source,
          graph_version: META_VERSION,
          connected_by: userData.user.id,
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,platform" })
      .select("id, workspace_id, platform, account_id, account_name, status, metadata, created_at, updated_at")
      .single()

    if (upsertError) throw upsertError
    return response({ integration })
  } catch (error) {
    console.error("[connect-instagram]", error instanceof Error ? error.message : error)
    return response({ error: error instanceof Error ? error.message : "Nao foi possivel conectar Instagram" }, 500)
  }
})

async function discoverInstagramAccount(token: string) {
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

  throw new Error("Token valido, mas sem conta Instagram Business/Creator acessivel.")
}

async function exchangeCodeForLongLivedToken(code: string, redirectUri: string) {
  const appId = requiredEnv("META_APP_ID")
  const appSecret = requiredEnv("META_APP_SECRET")
  const shortLived = await metaOAuth("oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })

  const shortToken = shortLived.access_token
  if (!shortToken) throw new Error("Meta nao retornou access_token.")

  const longLived = await metaOAuth("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  })

  return longLived.access_token ?? shortToken
}

async function metaOAuth(path: string, params: Record<string, string>) {
  const url = new URL(`${META_BASE_URL}/${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const res = await fetch(url)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.error?.message ?? text)
  return data
}

async function metaGet(path: string, token: string, query: string) {
  const separator = query ? `?${query}&` : "?"
  const res = await fetch(`${META_BASE_URL}${path}${separator}access_token=${encodeURIComponent(token)}`)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) return { ok: false, data: null, error: data?.error?.message ?? text }
  return { ok: true, data, error: null }
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
