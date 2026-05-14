import { randomBytes } from 'node:crypto'
import { getInstagramAuthorizationDebug, getMetaRedirectUri, INSTAGRAM_OAUTH_DEBUG_VERSION } from './_shared/meta'
import { ApiError, getSafeAppRedirectPath, handleError, json, methodNotAllowed } from './_shared/responses'
import { getWorkspaceId, requireAuth, requireWorkspaceMember } from './_shared/supabase'

export const config = {
  path: '/api/meta/login',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return methodNotAllowed()

    const url = new URL(request.url)
    const workspaceId = getWorkspaceId(url)
    const { user, admin } = await requireAuth(request)
    await requireWorkspaceMember(admin, workspaceId, user.id, { adminOnly: true })

    const state = randomBytes(24).toString('base64url')
    const redirectTo = getSafeAppRedirectPath(url.searchParams.get('redirect_to'), '/settings?connected=instagram')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const oauthRedirectUri = getMetaRedirectUri()
    const authDebug = getInstagramAuthorizationDebug(state, oauthRedirectUri)

    if (url.searchParams.get('debug') === '1') {
      return json(authDebug)
    }

    const { error } = await admin.from('meta_oauth_states').insert({
      state,
      provider: 'instagram',
      user_id: user.id,
      workspace_id: workspaceId,
      redirect_to: redirectTo,
      redirect_uri: oauthRedirectUri,
      expires_at: expiresAt,
    })

    if (error) throw new ApiError(500, 'oauth_state_failed', 'Erro ao iniciar autenticacao Meta.')

    const authUrl = authDebug.authorization_url_sanitized
    console.info('[meta-login] OAuth iniciado', {
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      provider: 'instagram',
      user_id: user.id,
      workspace_id: workspaceId,
      redirect_uri: oauthRedirectUri,
      state_expires_at: expiresAt,
      redirect_to: redirectTo,
    })

    if (request.headers.get('accept')?.includes('application/json') || url.searchParams.get('format') === 'json') {
      return json({ auth_url: authUrl, expires_at: expiresAt })
    }

    return Response.redirect(authUrl, 302)
  } catch (error) {
    if (error instanceof ApiError && ['not_authenticated', 'invalid_session'].includes(error.code)) {
      return handleError(
        new ApiError(401, 'user_not_authenticated', 'Usuario nao autenticado para iniciar OAuth do Instagram.'),
        'meta-login',
      )
    }

    return handleError(error, 'meta-login')
  }
}
