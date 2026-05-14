import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'
import { getWorkspaceId, requireAuth, requireWorkspaceMember } from './_shared/supabase'

export const config = {
  path: '/api/meta/disconnect',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') return methodNotAllowed()

    const body = await request.json().catch(() => ({}))
    const workspaceId = getWorkspaceId(new URL(request.url), body)
    const { user, admin } = await requireAuth(request)
    await requireWorkspaceMember(admin, workspaceId, user.id, { adminOnly: true })

    const { error } = await admin
      .from('workspace_integrations')
      .update({
        status: 'disconnected',
        access_token: null,
        page_access_token_encrypted: null,
        token_expires_at: null,
        permissions: [],
        metadata: {
          disconnected_at: new Date().toISOString(),
          disconnected_by: user.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')

    if (error) throw new ApiError(500, 'disconnect_failed', 'Erro ao desconectar Instagram.')

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        ig_user_id: null,
        ig_access_token: null,
        ig_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) throw new ApiError(500, 'disconnect_profile_failed', 'Erro ao limpar dados Instagram do perfil.')

    await admin
      .from('meta_pending_instagram_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)

    console.info('[meta-disconnect] Integracao desconectada', { user_id: user.id, workspace_id: workspaceId })
    return json({ ok: true })
  } catch (error) {
    return handleError(error, 'meta-disconnect')
  }
}
