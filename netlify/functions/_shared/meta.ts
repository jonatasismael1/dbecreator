import { getEnv } from './env'
import { ApiError } from './responses'

export const META_SCOPES = [
  'pages_show_list',
  'instagram_basic',
  'instagram_manage_insights',
  'pages_read_engagement',
]

export interface MetaPage {
  id: string
  name: string
  access_token?: string
  perms?: string[]
  tasks?: string[]
}

export interface PendingInstagramAccount {
  meta_user_id: string
  facebook_page_id: string
  facebook_page_name: string
  page_access_token: string
  instagram_business_account_id: string
  instagram_username: string | null
  permissions: string[]
  token_expires_at: string | null
}

export class MetaApiError extends ApiError {
  constructor(
    public graphCode: number | null,
    public graphSubcode: number | null,
    message: string,
    details?: unknown,
  ) {
    super(mapGraphStatus(graphCode), mapGraphCode(graphCode, graphSubcode), message, details)
  }
}

export function getMetaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getEnv('META_APP_ID'),
    redirect_uri: getEnv('META_REDIRECT_URI'),
    response_type: 'code',
    state,
    scope: META_SCOPES.join(','),
  })

  return `https://www.facebook.com/${getGraphVersion()}/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForLongLivedToken(code: string) {
  const shortLived = await graphRequest<{ access_token: string; token_type?: string; expires_in?: number }>(
    'oauth/access_token',
    {
      client_id: getEnv('META_APP_ID'),
      client_secret: getEnv('META_APP_SECRET'),
      redirect_uri: getEnv('META_REDIRECT_URI'),
      code,
    },
  )

  const longLived = await graphRequest<{ access_token: string; token_type?: string; expires_in?: number }>(
    'oauth/access_token',
    {
      grant_type: 'fb_exchange_token',
      client_id: getEnv('META_APP_ID'),
      client_secret: getEnv('META_APP_SECRET'),
      fb_exchange_token: shortLived.access_token,
    },
  )

  return {
    accessToken: longLived.access_token,
    expiresIn: longLived.expires_in ?? shortLived.expires_in ?? null,
  }
}

export async function getMetaUserId(userAccessToken: string): Promise<string> {
  const data = await graphGet<{ id: string }>('me', userAccessToken, { fields: 'id' })
  return data.id
}

export async function getConnectableInstagramAccounts(
  userAccessToken: string,
  metaUserId: string,
  tokenExpiresAt: string | null,
): Promise<PendingInstagramAccount[]> {
  const accounts = await graphGet<{ data?: MetaPage[] }>('me/accounts', userAccessToken, {
    fields: 'id,name,access_token,perms,tasks',
    limit: '100',
  })

  const pages = accounts.data ?? []
  if (pages.length === 0) {
    throw new ApiError(409, 'no_facebook_pages', 'Nenhuma Pagina do Facebook foi encontrada para este usuario.')
  }

  const results = await Promise.all(
    pages.map(async (page) => {
      if (!page.access_token) return null

      const detail = await graphGet<{
        id: string
        name?: string
        instagram_business_account?: { id: string; username?: string }
      }>(page.id, page.access_token, {
        fields: 'name,instagram_business_account{id,username}',
      })

      if (!detail.instagram_business_account?.id) return null

      return {
        meta_user_id: metaUserId,
        facebook_page_id: page.id,
        facebook_page_name: detail.name || page.name,
        page_access_token: page.access_token,
        instagram_business_account_id: detail.instagram_business_account.id,
        instagram_username: detail.instagram_business_account.username ?? null,
        permissions: page.perms ?? page.tasks ?? [],
        token_expires_at: tokenExpiresAt,
      }
    }),
  )

  const connectable = results.filter((account): account is PendingInstagramAccount => Boolean(account))
  if (connectable.length === 0) {
    throw new ApiError(
      409,
      'no_instagram_business_account',
      'Nenhuma Pagina com Instagram Business ou Creator conectado foi encontrada.',
    )
  }

  return connectable
}

export async function getInstagramInsights(igAccountId: string, pageAccessToken: string) {
  const profile = await graphGet<{
    id: string
    username?: string
    name?: string
    followers_count?: number
    media_count?: number
  }>(igAccountId, pageAccessToken, {
    fields: 'id,username,name,followers_count,media_count',
  })

  const metrics = {
    reach: null as number | null,
    profile_views: null as number | null,
    website_clicks: null as number | null,
    follower_count: typeof profile.followers_count === 'number' ? profile.followers_count : null,
  }
  const metricErrors: Record<string, string> = {}

  for (const metric of ['reach', 'profile_views', 'website_clicks', 'follower_count'] as const) {
    try {
      const insights = await graphGet<{
        data?: Array<{ name: string; values?: Array<{ value: number | Record<string, number>; end_time?: string }> }>
      }>(`${igAccountId}/insights`, pageAccessToken, {
        metric,
        period: 'day',
      })

      const latest = insights.data?.[0]?.values?.at(-1)?.value
      if (typeof latest === 'number') {
        metrics[metric] = latest
      } else if (latest && typeof latest === 'object') {
        metrics[metric] = Object.values(latest).reduce((sum, value) => sum + Number(value || 0), 0)
      }
    } catch (error) {
      if (error instanceof MetaApiError && error.code === 'token_expired') throw error
      metricErrors[metric] = error instanceof Error ? error.message : 'Metrica indisponivel.'
    }
  }

  return {
    account: profile,
    metrics,
    metric_errors: metricErrors,
    synced_at: new Date().toISOString(),
  }
}

export async function graphGet<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  return graphRequest<T>(path, { ...params, access_token: accessToken })
}

async function graphRequest<T>(path: string, params: Record<string, string>): Promise<T> {
  const cleanPath = path.replace(/^\/+/, '')
  const url = new URL(`https://graph.facebook.com/${getGraphVersion()}/${cleanPath}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url)
  const data = await response.json().catch(() => ({}))

  if (!response.ok || data?.error) {
    const graphError = data?.error
    throw new MetaApiError(
      typeof graphError?.code === 'number' ? graphError.code : null,
      typeof graphError?.error_subcode === 'number' ? graphError.error_subcode : null,
      graphError?.message || 'Erro retornado pela Graph API.',
      {
        type: graphError?.type,
        fbtrace_id: graphError?.fbtrace_id,
      },
    )
  }

  return data as T
}

function getGraphVersion(): string {
  return getEnv('META_GRAPH_API_VERSION').replace(/^\/+/, '')
}

function mapGraphStatus(code: number | null): number {
  if (code === 190) return 401
  if (code === 10 || code === 200 || code === 2500) return 403
  return 502
}

function mapGraphCode(code: number | null, subcode: number | null): string {
  if (code === 190) return 'token_expired'
  if (code === 10 || code === 200) return 'meta_app_review_required'
  if (subcode === 33) return 'instagram_not_business_or_creator'
  return 'meta_graph_error'
}
