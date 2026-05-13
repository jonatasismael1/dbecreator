import { randomBytes } from 'node:crypto'
import { getMetaOAuthUrl } from './_shared/meta'
import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'
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
    const redirectTo = url.searchParams.get('redirect_to') || '/settings?instagram=select'
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error } = await admin.from('meta_oauth_states').insert({
      state,
      user_id: user.id,
      workspace_id: workspaceId,
      redirect_to: redirectTo,
      expires_at: expiresAt,
    })

    if (error) throw new ApiError(500, 'oauth_state_failed', 'Erro ao iniciar autenticacao Meta.')

    const authUrl = getMetaOAuthUrl(state)
    console.info('[meta-login] OAuth iniciado', { user_id: user.id, workspace_id: workspaceId })

    if (request.headers.get('accept')?.includes('application/json') || url.searchParams.get('format') === 'json') {
      return json({ auth_url: authUrl, expires_at: expiresAt })
    }

    return Response.redirect(authUrl, 302)
  } catch (error) {
    return handleError(error, 'meta-login')
  }
}
