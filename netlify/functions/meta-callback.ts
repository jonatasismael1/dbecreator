import { encryptToken } from './_shared/crypto'
import {
  exchangeCodeForInstagramToken,
  getInstagramOAuthConfig,
  getInstagramProfile,
  INSTAGRAM_OAUTH_DEBUG_VERSION,
} from './_shared/meta'
import { ApiError, json, redirectToApp } from './_shared/responses'
import { getAdminClient } from './_shared/supabase'

const DEBUG_VERSION = INSTAGRAM_OAUTH_DEBUG_VERSION

export const config = {
  path: ['/api/meta/callback', '/auth/instagram/callback'],
}

export default async function handler(request: Request): Promise<Response> {
  let currentStep: CallbackStep = 'callback_start'

  try {
    if (request.method !== 'GET') return redirectToApp('/settings?meta_error=method_not_allowed')

    const url = new URL(request.url)
    if (url.searchParams.get('debug_env') === '1') {
      const envDebug = getInstagramEnvDebug()
      return json({
        debug_version: DEBUG_VERSION,
        function: 'meta-callback',
        has_instagram_app_id: envDebug.has_instagram_app_id,
        has_instagram_secret: envDebug.has_instagram_secret,
        has_instagram_redirect_uri: envDebug.has_instagram_redirect_uri,
        redirect_uri: envDebug.redirect_uri,
      })
    }

    currentStep = 'validation'
    console.info('[meta-callback] Parametros recebidos no callback Instagram', getCallbackParamsDebug(url))

    const oauthCallbackError = getOAuthCallbackError(url)
    if (oauthCallbackError) {
      console.warn('[meta-callback] OAuth retornou erro no callback', oauthCallbackError)
      return redirectToApp(
        `/settings?meta_error=instagram_oauth_error&meta_message=${encodeURIComponent(oauthCallbackError.message)}`,
      )
    }

    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code) throw new ApiError(400, 'missing_code', 'Callback do Instagram sem code.')
    if (!state) throw new ApiError(400, 'invalid_state', 'Callback do Instagram sem state.')
    console.info('[meta-callback] Code OAuth recebido', {
      code: maskCode(code),
      code_length: code.length,
      code_used_without_trim: code === url.searchParams.get('code'),
      code_has_outer_whitespace: code !== code.trim(),
      has_state: Boolean(state),
    })

    currentStep = 'state_validation'
    const admin = getAdminClient()
    const { data: oauthState, error: stateError } = await admin
      .from('meta_oauth_states')
      .select('state,user_id,workspace_id,redirect_to,redirect_uri,expires_at,provider')
      .eq('state', state)
      .eq('provider', 'instagram')
      .maybeSingle()

    if (stateError) {
      console.warn('[meta-callback] Falha ao consultar state OAuth', { step: currentStep, error: sanitizeError(stateError) })
      throw new ApiError(500, 'invalid_state', 'Erro ao validar state OAuth do Instagram.', sanitizeError(stateError))
    }
    if (!oauthState) throw new ApiError(400, 'invalid_state', 'State OAuth invalido ou expirado.')
    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      await admin.from('meta_oauth_states').delete().eq('state', state).eq('provider', 'instagram')
      throw new ApiError(400, 'invalid_state', 'State OAuth expirado. Tente conectar novamente.')
    }

    console.info('[meta-callback] State OAuth validado', {
      user_id: oauthState.user_id,
      workspace_id: oauthState.workspace_id,
      redirect_uri: oauthState.redirect_uri ?? null,
    })

    currentStep = 'token_exchange'
    console.info('[meta-callback] Trocando code por token Instagram', {
      user_id: oauthState.user_id,
      workspace_id: oauthState.workspace_id,
    })
    const token = await runStep(
      currentStep,
      'token_exchange_failed',
      'Falha ao trocar code por access_token do Instagram.',
      () => exchangeCodeForInstagramToken(code),
    )
    const tokenExpiresAt = token.expiresIn
      ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
      : null
    console.info('[meta-callback] Token Instagram recebido', {
      user_id: oauthState.user_id,
      workspace_id: oauthState.workspace_id,
      token_expires_at: tokenExpiresAt,
    })

    currentStep = 'profile_fetch'
    const profile = await runStep(
      currentStep,
      'profile_fetch_failed',
      'Falha ao buscar dados da conta Instagram conectada.',
      () => getInstagramProfile(token.accessToken, token.userId || undefined),
    )
    console.info('[meta-callback] Usuario Instagram identificado', {
      user_id: oauthState.user_id,
      workspace_id: oauthState.workspace_id,
      instagram_user_id: profile.id,
      instagram_username: profile.username ?? null,
    })

    currentStep = 'encryption'
    const encryptedToken = await runStep(
      currentStep,
      'encryption_failed',
      'Falha ao criptografar token do Instagram.',
      () => Promise.resolve(encryptToken(token.accessToken)),
    )

    currentStep = 'database_save'
    const accountName = profile.username || profile.name || profile.id
    const { error: upsertError } = await admin
      .from('workspace_integrations')
      .upsert(
        {
          workspace_id: oauthState.workspace_id,
          platform: 'instagram',
          user_id: oauthState.user_id,
          access_token: null,
          account_id: profile.id,
          account_name: accountName,
          status: 'connected',
          metadata: {
            source: 'instagram_oauth',
            instagram_username: profile.username ?? null,
            instagram_name: profile.name ?? null,
            instagram_biography: profile.biography ?? null,
            instagram_followers_count: profile.followers_count ?? null,
            instagram_follows_count: profile.follows_count ?? null,
            instagram_media_count: profile.media_count ?? null,
            profile_picture_url: profile.profile_picture_url ?? null,
            connected_at: new Date().toISOString(),
          },
          meta_user_id: token.userId || profile.id,
          facebook_page_id: null,
          facebook_page_name: null,
          page_access_token_encrypted: encryptedToken,
          instagram_business_account_id: profile.id,
          token_expires_at: tokenExpiresAt,
          permissions: token.permissions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform' },
      )

    if (upsertError) {
      console.warn('[meta-callback] Falha ao salvar integracao Instagram', {
        step: currentStep,
        user_id: oauthState.user_id,
        workspace_id: oauthState.workspace_id,
        account_id: profile.id,
        error: sanitizeError(upsertError),
      })
      throw new ApiError(500, 'database_save_failed', 'Erro ao salvar integracao Instagram.', sanitizeError(upsertError))
    }

    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({
        ig_user_id: profile.id,
        ig_access_token: encryptedToken,
        ig_token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', oauthState.user_id)

    if (profileUpdateError) {
      console.warn('[meta-callback] Falha ao atualizar perfil com dados Instagram', {
        step: currentStep,
        user_id: oauthState.user_id,
        workspace_id: oauthState.workspace_id,
        account_id: profile.id,
        error: sanitizeError(profileUpdateError),
      })
      throw new ApiError(500, 'profile_save_failed', 'Erro ao salvar dados Instagram no perfil.', sanitizeError(profileUpdateError))
    }

    await admin.from('meta_oauth_states').delete().eq('state', state).eq('provider', 'instagram')
    console.info('[meta-callback] Integracao Instagram OAuth salva', {
      user_id: oauthState.user_id,
      workspace_id: oauthState.workspace_id,
      instagram_user_id: profile.id,
      permissions: token.permissions,
    })

    currentStep = 'redirect'
    return safeRedirect(oauthState.redirect_to || '/settings?connected=instagram')
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(500, getFallbackErrorCode(currentStep), 'Erro no callback OAuth do Instagram.', sanitizeError(error))

    console.warn('[meta-callback] Erro controlado no callback OAuth', {
      step: currentStep,
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    })

    return safeRedirect(buildErrorRedirect(apiError, currentStep))
  }
}

type CallbackStep =
  | 'callback_start'
  | 'validation'
  | 'state_validation'
  | 'token_exchange'
  | 'profile_fetch'
  | 'encryption'
  | 'database_save'
  | 'redirect'

async function runStep<T>(
  step: CallbackStep,
  code: string,
  message: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    const apiError = error instanceof ApiError ? error : null
    const shouldPreserveApiError = apiError && (step === 'token_exchange' || isExactOAuthErrorCode(apiError.code))
    const finalCode = shouldPreserveApiError && isExactOAuthErrorCode(apiError.code) ? apiError.code : code
    const finalMessage = shouldPreserveApiError ? apiError.message : message
    const finalDetails = shouldPreserveApiError
      ? getApiErrorDetails(apiError) ?? sanitizeError(error)
      : sanitizeError(error)

    console.warn('[meta-callback] Etapa falhou', {
      step,
      code: finalCode,
      error: finalDetails,
    })
    throw new ApiError(apiError?.status ?? 500, finalCode, finalMessage, finalDetails)
  }
}

function isExactOAuthErrorCode(code: string): boolean {
  return [
    'missing_instagram_env',
    'invalid_client_id',
    'invalid_client_secret',
    'redirect_uri_mismatch',
    'invalid_grant',
    'invalid_request',
    'invalid_code',
  ].includes(code)
}

function safeRedirect(path: string): Response {
  try {
    return redirectToApp(path)
  } catch (error) {
    console.error('[meta-callback] Falha no redirect final', {
      step: 'redirect',
      code: 'redirect_failed',
      error: sanitizeError(error),
    })
    return json({ error: 'redirect_failed', message: 'Falha ao redirecionar apos OAuth do Instagram.' }, 500)
  }
}

function buildErrorRedirect(error: ApiError, step: CallbackStep): string {
  const params = new URLSearchParams({
    meta_error: error.code,
    meta_message: error.message,
    debug_version: DEBUG_VERSION,
  })

  const debug = buildDebugPayload(error, step)
  if (debug) params.set('meta_debug', JSON.stringify(debug))

  return `/settings?${params.toString()}`
}

function buildDebugPayload(error: ApiError, step: CallbackStep) {
  if (!['token_exchange', 'profile_fetch'].includes(step) && !['token_exchange_failed', 'profile_fetch_failed', 'meta_graph_error'].includes(error.code)) return null

  const envDebug = getInstagramEnvDebug()
  const details = error.details && typeof error.details === 'object'
    ? error.details as Record<string, unknown>
    : null
  const nestedDetails = details?.details && typeof details.details === 'object'
    ? details.details as Record<string, unknown>
    : null
  const source = nestedDetails ?? details

  if (!source) {
    return {
      debug_version: DEBUG_VERSION,
      function: 'meta-callback',
      step,
      etapa: step,
      error: error.code,
      message: error.message,
      status: null,
      status_text: null,
      body: null,
      redirect_uri: envDebug.redirect_uri,
      app_id: envDebug.app_id,
      client_id: envDebug.app_id,
      has_app_id: envDebug.has_instagram_app_id,
      has_secret: envDebug.has_instagram_secret,
      has_redirect_uri: envDebug.has_instagram_redirect_uri,
      content_type: null,
      raw_error: details ?? null,
    }
  }

  return {
    debug_version: DEBUG_VERSION,
    function: 'meta-callback',
    step,
    etapa: source.etapa ?? step,
    error: error.code,
    message: error.message,
    status: source.status ?? null,
    status_text: source.status_text ?? null,
    body: source.body ?? null,
    endpoint: source.endpoint ?? null,
    redirect_uri: source.redirect_uri ?? envDebug.redirect_uri,
    app_id: source.app_id ?? source.client_id ?? envDebug.app_id,
    client_id: source.client_id ?? source.app_id ?? envDebug.app_id,
    has_app_id: source.has_app_id ?? envDebug.has_instagram_app_id,
    has_secret: source.has_secret ?? source.has_instagram_app_secret ?? envDebug.has_instagram_secret,
    has_redirect_uri: source.has_redirect_uri ?? envDebug.has_instagram_redirect_uri,
    has_instagram_app_secret: source.has_instagram_app_secret ?? null,
    content_type: source.content_type ?? null,
    code_length: source.code_length ?? null,
    code_prefix: source.code_prefix ?? null,
    network_error: source.network_error ?? null,
    type: source.type ?? null,
    fbtrace_id: source.fbtrace_id ?? null,
    attempts: source.attempts ?? null,
    raw_error: details ?? null,
  }
}

function getApiErrorDetails(error: ApiError | null): unknown {
  if (!error?.details) return null
  if (typeof error.details !== 'object') return error.details

  const details = error.details as Record<string, unknown>
  if (details.details && typeof details.details === 'object') return details.details
  return details
}

function getInstagramEnvDebug() {
  try {
    const config = getInstagramOAuthConfig()
    return {
      has_instagram_app_id: true,
      has_instagram_secret: true,
      has_instagram_redirect_uri: true,
      redirect_uri: config.instagramRedirectUri,
      app_id: config.instagramAppId,
    }
  } catch (error) {
    const details = error instanceof ApiError && error.details && typeof error.details === 'object'
      ? error.details as Record<string, unknown>
      : {}

    return {
      has_instagram_app_id: Boolean(details.has_app_id),
      has_instagram_secret: Boolean(details.has_secret),
      has_instagram_redirect_uri: Boolean(details.has_redirect_uri),
      redirect_uri: typeof details.redirect_uri === 'string' ? details.redirect_uri : null,
      app_id: null,
    }
  }
}

function getCallbackParamsDebug(url: URL) {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const errorReason = url.searchParams.get('error_reason')
  const errorDescription = url.searchParams.get('error_description')

  return {
    debug_version: DEBUG_VERSION,
    callback_path: url.pathname,
    query_keys: Array.from(url.searchParams.keys()),
    code: code ? maskCode(code) : null,
    code_present: Boolean(code),
    code_length: code?.length ?? 0,
    state: state ? maskCode(state) : null,
    state_present: Boolean(state),
    state_length: state?.length ?? 0,
    error,
    error_reason: errorReason,
    error_description: errorDescription,
    has_error: Boolean(error || errorReason || errorDescription),
  }
}

function getOAuthCallbackError(url: URL): { error: string | null; error_reason: string | null; error_description: string | null; message: string } | null {
  const error = url.searchParams.get('error')
  const errorReason = url.searchParams.get('error_reason')
  const errorDescription = url.searchParams.get('error_description')

  if (!error && !errorReason && !errorDescription) return null

  return {
    error,
    error_reason: errorReason,
    error_description: errorDescription,
    message: errorDescription || errorReason || error || 'Instagram retornou erro no OAuth.',
  }
}

function getFallbackErrorCode(step: CallbackStep): string {
  const codes: Record<CallbackStep, string> = {
    callback_start: 'redirect_failed',
    validation: 'invalid_state',
    state_validation: 'invalid_state',
    token_exchange: 'token_exchange_failed',
    profile_fetch: 'profile_fetch_failed',
    encryption: 'encryption_failed',
    database_save: 'database_save_failed',
    redirect: 'redirect_failed',
  }

  return codes[step]
}

function sanitizeError(error: unknown): unknown {
  if (!error) return null
  if (error instanceof ApiError) {
    return {
      code: error.code,
      status: error.status,
      message: error.message,
      details: error.details,
    }
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }
  if (typeof error !== 'object') return error

  return Object.fromEntries(
    Object.entries(error as Record<string, unknown>).map(([key, value]) => [
      key,
      key.toLowerCase().includes('token') || key.toLowerCase().includes('secret') ? '[redacted]' : value,
    ]),
  )
}

function maskCode(code: string): string {
  return code.length > 8 ? `${code.slice(0, 8)}...` : code
}
