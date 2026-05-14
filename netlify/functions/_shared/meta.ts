import { getOptionalEnv } from './env'
import { ApiError } from './responses'

export const META_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
  'instagram_business_content_publish',
  'instagram_business_manage_insights',
]
export const INSTAGRAM_OAUTH_DEBUG_VERSION = 'instagram_oauth_debug_preserve_003'
export const INSTAGRAM_AUTHORIZE_ENDPOINT = 'https://www.instagram.com/oauth/authorize'
export const INSTAGRAM_TOKEN_ENDPOINT = 'https://api.instagram.com/oauth/access_token'
export const INSTAGRAM_LONG_LIVED_TOKEN_PATH = 'access_token'
export const INSTAGRAM_CALLBACK_REDIRECT_URI = 'https://dbecreator.netlify.app/auth/instagram/callback'

export interface InstagramOAuthToken {
  accessToken: string
  userId: string
  expiresIn: number | null
  permissions: string[]
}

export interface InstagramProfile {
  id: string
  username?: string
  name?: string
  biography?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
  profile_picture_url?: string
}

interface InstagramInsightValue {
  value: number | Record<string, number>
  end_time?: string
}

interface InstagramInsight {
  name: string
  period?: string
  values?: InstagramInsightValue[]
}

interface InstagramInsightsPayload {
  data?: InstagramInsight[]
}

export interface InstagramMedia {
  id: string
  caption?: string
  media_type?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  media_url?: string
  permalink?: string
  thumbnail_url?: string
  insights: {
    media_views: number | null
    media_viewers: number | null
    reach: number | null
    likes: number | null
    comments: number | null
    saved: number | null
    shares: number | null
    total_interactions: number | null
  }
  insight_errors: Record<string, string>
}

export class MetaApiError extends ApiError {
  constructor(
    public httpStatus: number,
    public graphCode: number | null,
    public graphSubcode: number | null,
    message: string,
    details?: unknown,
    apiCode?: string | null,
  ) {
    super(mapGraphStatus(httpStatus, graphCode), mapGraphCode(graphCode, graphSubcode, apiCode), message, details)
  }
}

export function getMetaOAuthUrl(state: string, redirectUri?: string): string {
  const config = getInstagramOAuthConfig(redirectUri)
  const authorizationUrl = buildInstagramAuthorizationUrl(config, state)
  console.info('[meta] Instagram OAuth URL montada', {
    debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
    authorization_url: authorizationUrl,
    redirect_uri: config.instagramRedirectUri,
    scopes: META_SCOPES.join(' '),
  })

  return authorizationUrl
}

export async function exchangeCodeForInstagramToken(code: string, redirectUri?: string): Promise<InstagramOAuthToken> {
  const config = getInstagramOAuthConfig(redirectUri)

  console.info('[meta] Preparando token exchange Instagram', {
    debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
    endpoint: INSTAGRAM_TOKEN_ENDPOINT,
    redirect_uri: config.instagramRedirectUri,
    client_id: config.instagramAppId,
    has_app_id: true,
    has_secret: true,
    has_redirect_uri: true,
    content_type: FORM_CONTENT_TYPE,
  })

  const shortLived = await instagramOAuthTokenRequest<{
    access_token: string
    user_id?: number | string
    expires_in?: number
    permissions?: unknown
  }>(INSTAGRAM_TOKEN_ENDPOINT, {
    client_id: config.instagramAppId,
    client_secret: config.instagramAppSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.instagramRedirectUri,
    code,
  })

  console.info('[meta] Resposta da troca de code por token Instagram', {
    has_access_token: Boolean(shortLived.access_token),
    user_id: shortLived.user_id ? String(shortLived.user_id) : null,
    permissions: parsePermissions(shortLived.permissions),
  })

  const longLived = await exchangeForLongLivedInstagramToken(shortLived.access_token, config).catch((error) => {
    console.warn('[meta] Troca para token longo Instagram falhou; salvando token inicial valido', {
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      step: 'long_lived_token_exchange',
      error: sanitizeErrorForLog(error),
    })
    return null
  })

  return {
    accessToken: longLived?.access_token || shortLived.access_token,
    userId: shortLived.user_id ? String(shortLived.user_id) : '',
    expiresIn: longLived?.expires_in ?? shortLived.expires_in ?? null,
    permissions: parsePermissions(shortLived.permissions),
  }
}

export async function getInstagramProfile(userAccessToken: string, igUserId?: string): Promise<InstagramProfile> {
  const profilePath = igUserId || 'me'
  const fullFields = 'id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url'
  const minimalFields = 'id,username'
  const errors: unknown[] = []

  for (const attempt of [
    () => graphGet<InstagramProfile>(profilePath, userAccessToken, { fields: fullFields }),
    () => instagramGraphGet<InstagramProfile>(profilePath, userAccessToken, { fields: fullFields }),
    () => instagramGraphGet<InstagramProfile>('me', userAccessToken, { fields: minimalFields }),
  ]) {
    try {
      const profile = await attempt()
      return normalizeInstagramProfile(profile, igUserId)
    } catch (error) {
      errors.push(sanitizeErrorForLog(error))
    }
  }

  if (igUserId) {
    console.warn('[meta] Perfil Instagram indisponivel; usando user_id retornado no token', {
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      instagram_user_id: igUserId,
      attempts: errors,
    })
    return { id: igUserId }
  }

  throw new ApiError(502, 'profile_fetch_failed', 'Falha ao buscar dados da conta Instagram conectada.', {
    debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
    endpoint: 'instagram_profile',
    attempts: errors,
  })
}

export async function getInstagramInsights(igAccountId: string, instagramAccessToken: string) {
  const profile = await getInstagramProfile(instagramAccessToken, igAccountId)

  const metrics = {
    media_views: null as number | null,
    media_viewers: null as number | null,
    reach: null as number | null,
    follower_count: null as number | null,
    profile_views: null as number | null,
  }
  const metricErrors: Record<string, string> = {}

  await loadInsightMetricAliases(
    `${igAccountId}/insights`,
    instagramAccessToken,
    [
      { key: 'media_views', aliases: ['media_views', 'views'] },
      { key: 'media_viewers', aliases: ['media_viewers'] },
      { key: 'reach', aliases: ['reach'] },
      { key: 'follower_count', aliases: ['follower_count'] },
      { key: 'profile_views', aliases: ['profile_views'] },
    ],
    metrics,
    metricErrors,
    { period: 'day' },
  )

  const media = await getRecentInstagramMedia(igAccountId, instagramAccessToken)

  return {
    account: profile,
    metrics,
    media,
    metric_errors: metricErrors,
    synced_at: new Date().toISOString(),
  }
}

export async function graphGet<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  return graphRequest<T>(path, { ...params, access_token: accessToken })
}

async function instagramGraphGet<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  const cleanPath = path.replace(/^\/+/, '')
  const url = new URL(`https://graph.instagram.com/${getGraphApiVersion()}/${cleanPath}`)
  return fetchJson<T>(url, { ...params, access_token: accessToken })
}

export function getMetaRedirectUri(): string {
  return getInstagramOAuthConfig().instagramRedirectUri
}

export interface InstagramOAuthConfig {
  instagramAppId: string
  instagramAppSecret: string
  instagramRedirectUri: string
}

export function getInstagramOAuthConfig(_redirectUriOverride?: string | null): InstagramOAuthConfig {
  const instagramAppId = getOptionalEnv('INSTAGRAM_APP_ID') || getOptionalEnv('INSTAGRAM_CLIENT_ID')
  const instagramAppSecret = getOptionalEnv('INSTAGRAM_APP_SECRET') || getOptionalEnv('INSTAGRAM_CLIENT_SECRET')
  const configuredRedirectUri = getOptionalEnv('INSTAGRAM_REDIRECT_URI')?.trim()
  const hasRedirectUri = Boolean(configuredRedirectUri || INSTAGRAM_CALLBACK_REDIRECT_URI)
  const instagramRedirectUri = INSTAGRAM_CALLBACK_REDIRECT_URI

  if (configuredRedirectUri && configuredRedirectUri !== INSTAGRAM_CALLBACK_REDIRECT_URI) {
    console.warn('[meta] INSTAGRAM_REDIRECT_URI ignorada por divergencia com callback oficial', {
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      configured_redirect_uri: configuredRedirectUri,
      expected_redirect_uri: INSTAGRAM_CALLBACK_REDIRECT_URI,
    })
  }

  if (!instagramAppId || !instagramAppSecret || !hasRedirectUri) {
    const details = {
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      has_app_id: Boolean(instagramAppId),
      has_secret: Boolean(instagramAppSecret),
      has_redirect_uri: hasRedirectUri,
      redirect_uri: instagramRedirectUri,
    }
    console.warn('[meta] Variaveis Instagram OAuth ausentes', details)
    throw new ApiError(
      500,
      'missing_instagram_env',
      'Variaveis de ambiente do Instagram OAuth nao configuradas.',
      details,
    )
  }

  return {
    instagramAppId,
    instagramAppSecret,
    instagramRedirectUri,
  }
}

export function getInstagramAuthorizationDebug(state: string, redirectUri?: string) {
  const config = getInstagramOAuthConfig(redirectUri)
  return {
    debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
    provider: 'instagram',
    endpoint: INSTAGRAM_AUTHORIZE_ENDPOINT,
    client_id: config.instagramAppId,
    redirect_uri: config.instagramRedirectUri,
    scopes: META_SCOPES,
    has_state: Boolean(state),
    authorization_url_sanitized: buildInstagramAuthorizationUrl(config, state),
  }
}

function buildInstagramAuthorizationUrl(config: InstagramOAuthConfig, state: string): string {
  const query = [
    ['force_reauth', 'true'],
    ['client_id', config.instagramAppId],
    ['redirect_uri', config.instagramRedirectUri],
    ['response_type', 'code'],
    ['scope', META_SCOPES.join(' ')],
    ['state', state],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  return `${INSTAGRAM_AUTHORIZE_ENDPOINT}?${query}`
}

async function graphRequest<T>(path: string, params: Record<string, string>): Promise<T> {
  const cleanPath = path.replace(/^\/+/, '')
  const url = new URL(`https://graph.facebook.com/${getGraphApiVersion()}/${cleanPath}`)
  return fetchJson<T>(url, params)
}

async function fetchJson<T>(url: URL, params: Record<string, string>): Promise<T> {
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  } catch (error) {
    console.warn('[meta] Falha de rede na API Instagram Graph', {
      endpoint: url.origin + url.pathname,
      error: sanitizeFetchError(error),
    })
    throw error
  }
  const data = await response.json().catch(() => ({}))

  if (!response.ok || data?.error) {
    const graphError = data?.error
    console.warn('[meta] Erro da API Instagram Graph', {
      endpoint: url.origin + url.pathname,
      status: response.status,
      body: redactApiBody(data),
    })

    throw new MetaApiError(
      response.status,
      typeof graphError?.code === 'number' ? graphError.code : null,
    typeof graphError?.error_subcode === 'number' ? graphError.error_subcode : null,
      graphError?.message || 'Erro retornado pela Graph API.',
      {
        endpoint: url.origin + url.pathname,
        status: response.status,
        status_text: response.statusText,
        body: redactApiBody(data),
        type: graphError?.type,
        fbtrace_id: graphError?.fbtrace_id,
      },
      getGraphApiErrorCode(graphError),
    )
  }

  return data as T
}

async function exchangeForLongLivedInstagramToken(
  accessToken: string,
  config: InstagramOAuthConfig,
): Promise<{ access_token: string; token_type?: string; expires_in?: number }> {
  const url = new URL(`https://graph.facebook.com/${getGraphApiVersion()}/${INSTAGRAM_LONG_LIVED_TOKEN_PATH}`)
  url.searchParams.set('grant_type', 'ig_exchange_token')
  url.searchParams.set('client_id', config.instagramAppId)
  url.searchParams.set('client_secret', config.instagramAppSecret)
  url.searchParams.set('access_token', accessToken)

  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  } catch (error) {
    throw new ApiError(502, 'long_lived_token_exchange_failed', 'Falha de rede ao gerar token longo do Instagram.', {
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      endpoint: url.origin + url.pathname,
      status: null,
      body: null,
      network_error: sanitizeFetchError(error),
    })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.error) {
    const graphError = data?.error
    throw new MetaApiError(
      response.status,
      typeof graphError?.code === 'number' ? graphError.code : null,
      typeof graphError?.error_subcode === 'number' ? graphError.error_subcode : null,
      graphError?.message || 'Erro ao gerar token longo do Instagram.',
      {
        debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
        endpoint: url.origin + url.pathname,
        status: response.status,
        status_text: response.statusText,
        body: redactApiBody(data),
        type: graphError?.type,
        fbtrace_id: graphError?.fbtrace_id,
      },
    )
  }

  console.info('[meta] Resposta da troca para token longo Instagram', {
    has_access_token: Boolean(data.access_token),
    token_type: data.token_type ?? null,
    expires_in: data.expires_in ?? null,
  })

  return data as { access_token: string; token_type?: string; expires_in?: number }
}

async function getRecentInstagramMedia(igAccountId: string, instagramAccessToken: string): Promise<InstagramMedia[]> {
  const response = await instagramGraphGet<{ data?: Omit<InstagramMedia, 'insights' | 'insight_errors'>[] }>(
    `${igAccountId}/media`,
    instagramAccessToken,
    {
      fields: 'id,caption,media_type,timestamp,like_count,comments_count,media_url,permalink,thumbnail_url',
      limit: '12',
    },
  )

  const media = response.data ?? []
  return Promise.all(media.map(async (item) => {
    const insights = {
      media_views: null as number | null,
      media_viewers: null as number | null,
      reach: null as number | null,
      likes: typeof item.like_count === 'number' ? item.like_count : null,
      comments: typeof item.comments_count === 'number' ? item.comments_count : null,
      saved: null as number | null,
      shares: null as number | null,
      total_interactions: null as number | null,
    }
    const insightErrors: Record<string, string> = {}

    await loadInsightMetricAliases(
      `${item.id}/insights`,
      instagramAccessToken,
      [
        { key: 'media_views', aliases: ['media_views', 'views', 'plays'] },
        { key: 'media_viewers', aliases: ['media_viewers'] },
        { key: 'reach', aliases: ['reach'] },
        { key: 'likes', aliases: ['likes'] },
        { key: 'comments', aliases: ['comments'] },
        { key: 'saved', aliases: ['saved', 'saves'] },
        { key: 'shares', aliases: ['shares'] },
        { key: 'total_interactions', aliases: ['total_interactions'] },
      ],
      insights,
      insightErrors,
    )

    return {
      ...item,
      insights,
      insight_errors: insightErrors,
    }
  }))
}

interface InsightMetricAlias<T extends Record<string, number | null>> {
  key: keyof T & string
  aliases: string[]
}

async function loadInsightMetricAliases<T extends Record<string, number | null>>(
  path: string,
  accessToken: string,
  metrics: Array<InsightMetricAlias<T>>,
  target: T,
  metricErrors: Record<string, string>,
  extraParams: Record<string, string> = {},
) {
  await Promise.all(metrics.map(async ({ key, aliases }) => {
    for (const metric of aliases) {
      try {
        const insights = await instagramGraphGet<InstagramInsightsPayload>(path, accessToken, {
          ...extraParams,
          metric,
        })
        const value = getMetricValue(insights, metric)
        if (typeof value === 'number') {
          target[key] = value as T[typeof key]
          return
        }
      } catch (metricError) {
        if (metricError instanceof MetaApiError && isTokenAuthError(metricError)) throw metricError
        metricErrors[key] = metricError instanceof Error ? metricError.message : 'Metrica indisponivel.'
      }
    }
  }))
}

function isTokenAuthError(error: MetaApiError): boolean {
  return ['token_expired', 'invalid_access_token'].includes(error.code)
}

function applyInsightPayload<T extends Record<string, number | null>>(payload: InstagramInsightsPayload, target: T) {
  for (const insight of payload.data ?? []) {
    if (!(insight.name in target)) continue
    target[insight.name as keyof T] = getLatestInsightValue(insight) as T[keyof T]
  }
}

function getMetricValue(payload: InstagramInsightsPayload, metric: string): number | null {
  const insight = (payload.data ?? []).find((item) => item.name === metric) ?? payload.data?.[0]
  return insight ? getLatestInsightValue(insight) : null
}

function normalizeInstagramProfile(profile: InstagramProfile & { user_id?: string | number; profile_pic?: string }, fallbackId?: string): InstagramProfile {
  return {
    id: String(profile.id ?? profile.user_id ?? fallbackId ?? ''),
    username: profile.username,
    name: profile.name,
    biography: profile.biography,
    followers_count: profile.followers_count,
    follows_count: profile.follows_count,
    media_count: profile.media_count,
    profile_picture_url: profile.profile_picture_url ?? profile.profile_pic,
  }
}

function getLatestInsightValue(insight: InstagramInsight): number | null {
  const latest = insight.values?.at(-1)?.value
  if (typeof latest === 'number') return latest
  if (latest && typeof latest === 'object') {
    return Object.values(latest).reduce((sum, value) => sum + Number(value || 0), 0)
  }

  return null
}

async function instagramOAuthTokenRequest<T>(url: string, params: Record<string, string>): Promise<T> {
  const form = new URLSearchParams()
  form.append('client_id', params.client_id)
  form.append('client_secret', params.client_secret)
  form.append('grant_type', params.grant_type)
  form.append('redirect_uri', params.redirect_uri)
  form.append('code', params.code)
  const bodyString = form.toString()
  const safeBodyString = redactSerializedFormBody(bodyString)
  const serializedRedirectUri = new URLSearchParams(bodyString).get('redirect_uri')

  console.log('[meta] POST body:', safeBodyString)
  console.info('[meta] Body do POST OAuth Instagram', {
    endpoint: url,
    content_type: FORM_CONTENT_TYPE,
    serialization: 'URLSearchParams.toString()',
    redirect_uri_raw: params.redirect_uri,
    redirect_uri_contains_percent_encoding_before_serialization: params.redirect_uri.includes('%'),
    redirect_uri_after_form_parse: serializedRedirectUri,
    redirect_uri_roundtrip_ok: serializedRedirectUri === params.redirect_uri,
    code_used_without_trim: params.code === params.code.trim(),
    code_has_outer_whitespace: params.code !== params.code.trim(),
    body: {
      client_id: params.client_id,
      client_secret: '[redacted]',
      grant_type: params.grant_type,
      redirect_uri: params.redirect_uri,
      code: maskCode(params.code),
    },
    encoded_body: safeBodyString,
  })

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': FORM_CONTENT_TYPE,
      },
      body: bodyString,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch (error) {
    const debugDetails = getTokenExchangeDebugDetails(null, null, params, {
      network_error: sanitizeFetchError(error),
    })
    console.warn('[meta] Falha de rede na API OAuth Instagram', {
      endpoint: url,
      ...debugDetails,
    })
    throw new ApiError(502, 'token_exchange_failed', 'Falha de rede ao trocar code por token do Instagram.', debugDetails)
  }
  const data = await response.json().catch(() => ({}))
  const sanitizedBody = redactApiBody(data)

  if (!response.ok || data?.error) {
    const graphError = normalizeInstagramOAuthError(data)
    console.warn('[meta] Erro da API OAuth Instagram', {
      endpoint: url,
      ...getTokenExchangeDebugDetails(response, sanitizedBody, params),
    })

    throw new MetaApiError(
      response.status,
      typeof graphError?.code === 'number' ? graphError.code : null,
      typeof graphError?.error_subcode === 'number' ? graphError.error_subcode : null,
      graphError?.message || 'Erro retornado pela API OAuth do Instagram.',
      {
        ...getTokenExchangeDebugDetails(response, sanitizedBody, params),
        type: graphError?.type,
        fbtrace_id: graphError?.fbtrace_id,
      },
      graphError?.api_code ?? null,
    )
  }

  console.info('[meta] Token exchange Instagram OK', {
    status: response.status,
    statusText: response.statusText,
    has_access_token: Boolean((data as { access_token?: string }).access_token),
    user_id: (data as { user_id?: string | number }).user_id ? String((data as { user_id?: string | number }).user_id) : null,
  })

  return data as T
}

function getTokenExchangeDebugDetails(
  response: Response | null,
  body: unknown,
  params: Record<string, string>,
  extra: Record<string, unknown> = {},
) {
  return {
    debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
    function: 'meta-callback',
    etapa: 'token_exchange',
    status: response?.status ?? null,
    statusText: response?.statusText ?? null,
    status_text: response?.statusText ?? null,
    body,
    redirect_uri: params.redirect_uri,
    app_id: params.client_id,
    client_id: params.client_id,
    has_secret: Boolean(params.client_secret),
    has_app_id: Boolean(params.client_id),
    has_redirect_uri: Boolean(params.redirect_uri),
    content_type: FORM_CONTENT_TYPE,
    code_length: params.code.length,
    code_prefix: params.code.slice(0, 8),
    ...extra,
  }
}

const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded'
const FETCH_TIMEOUT_MS = 15_000

function normalizeInstagramOAuthError(data: Record<string, unknown>) {
  const nested = data.error && typeof data.error === 'object'
    ? data.error as Record<string, unknown>
    : null

  return {
    api_code: typeof data.error === 'string' ? data.error : typeof nested?.code === 'string' ? nested.code : null,
    code: typeof nested?.code === 'number'
      ? nested.code
      : typeof data.code === 'number'
        ? data.code
        : null,
    error_subcode: typeof nested?.error_subcode === 'number' ? nested.error_subcode : null,
    message: typeof nested?.message === 'string'
      ? nested.message
      : typeof data.error_message === 'string'
        ? data.error_message
        : typeof data.error_description === 'string'
          ? data.error_description
          : typeof data.error === 'string'
            ? data.error
            : null,
    type: typeof data.error_type === 'string'
      ? data.error_type
      : typeof nested?.type === 'string'
        ? nested.type
        : null,
    fbtrace_id: typeof nested?.fbtrace_id === 'string' ? nested.fbtrace_id : null,
  }
}

function parsePermissions(permissions: unknown): string[] {
  if (!permissions) return []

  if (typeof permissions === 'string') {
    return permissions
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean)
  }

  if (Array.isArray(permissions)) {
    return permissions
      .map((permission) => String(permission).trim())
      .filter(Boolean)
  }

  if (typeof permissions === 'object') {
    return Object.values(permissions as Record<string, unknown>)
      .flatMap((permission) => Array.isArray(permission) ? permission : [permission])
      .map((permission) => String(permission).trim())
      .filter(Boolean)
  }

  return []
}

function redactSerializedFormBody(bodyString: string): string {
  const safeForm = new URLSearchParams(bodyString)
  if (safeForm.has('client_secret')) safeForm.set('client_secret', '[redacted]')
  if (safeForm.has('code')) safeForm.set('code', maskCode(safeForm.get('code') || ''))
  return safeForm.toString()
}

function maskCode(code: string): string {
  return code.length > 8 ? `${code.slice(0, 8)}...` : code
}

function getGraphApiVersion(): string {
  return getOptionalEnv('META_GRAPH_API_VERSION') || 'v25.0'
}

function redactApiBody(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(redactApiBody)

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      key.toLowerCase().includes('token') ? '[redacted]' : redactApiBody(entry),
    ]),
  )
}

function sanitizeFetchError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return error
}

function sanitizeErrorForLog(error: unknown): unknown {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      status: error.status,
      message: error.message,
      details: error.details,
    }
  }

  return sanitizeFetchError(error)
}

function mapGraphStatus(httpStatus: number, code: number | null): number {
  if (code === 190) return 401
  if (code === 10 || code === 200 || code === 2500) return 403
  if (httpStatus >= 400 && httpStatus < 500) return httpStatus
  return 502
}

function mapGraphCode(code: number | null, subcode: number | null, apiCode?: string | null): string {
  if (apiCode && [
    'invalid_client_id',
    'invalid_client_secret',
    'redirect_uri_mismatch',
    'invalid_grant',
    'invalid_request',
    'invalid_code',
    'invalid_access_token',
  ].includes(apiCode)) {
    return apiCode
  }
  if (code === 190) return 'token_expired'
  if (code === 10 || code === 200) return 'meta_app_review_required'
  if (subcode === 33) return 'instagram_not_business_or_creator'
  return 'meta_graph_error'
}

function getGraphApiErrorCode(graphError: Record<string, unknown> | null | undefined): string | null {
  const message = typeof graphError?.message === 'string' ? graphError.message.toLowerCase() : ''
  if (message.includes('cannot parse access token') || message.includes('invalid oauth access token')) {
    return 'invalid_access_token'
  }

  return null
}
