import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'
import { getWorkspaceId, requireAuth, requireWorkspaceMember } from './_shared/supabase'

export const config = {
  path: '/api/meta/instagram-accounts',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') return listAccounts(request)
    if (request.method === 'POST') return selectAccount(request)
    return methodNotAllowed()
  } catch (error) {
    return handleError(error, 'meta-instagram-accounts')
  }
}

async function listAccounts(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const workspaceId = getWorkspaceId(url)
  const { user, admin } = await requireAuth(request)
  await requireWorkspaceMember(admin, workspaceId, user.id)

  const [{ data: pending, error: pendingError }, { data: integration, error: integrationError }] = await Promise.all([
    admin
      .from('meta_pending_instagram_accounts')
      .select('id,facebook_page_id,facebook_page_name,instagram_business_account_id,instagram_username,permissions,expires_at')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
    admin
      .from('workspace_integrations')
      .select('id,status,account_id,account_name,facebook_page_id,facebook_page_name,instagram_business_account_id,token_expires_at,permissions,updated_at')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .maybeSingle(),
  ])

  if (pendingError) throw new ApiError(500, 'pending_accounts_lookup_failed', 'Erro ao listar contas Instagram.')
  if (integrationError) throw new ApiError(500, 'integration_lookup_failed', 'Erro ao consultar integracao Instagram.')

  return json({
    connected: integration?.status === 'connected' ? integration : null,
    accounts: pending ?? [],
  })
}

async function selectAccount(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({}))
  const url = new URL(request.url)
  const workspaceId = getWorkspaceId(url, body)
  const pendingAccountId = typeof body.pending_account_id === 'string' ? body.pending_account_id : null
  if (!pendingAccountId) throw new ApiError(400, 'missing_pending_account_id', 'pending_account_id e obrigatorio.')

  const { user, admin } = await requireAuth(request)
  await requireWorkspaceMember(admin, workspaceId, user.id, { adminOnly: true })

  const { data: pending, error: pendingError } = await admin
    .from('meta_pending_instagram_accounts')
    .select('*')
    .eq('id', pendingAccountId)
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (pendingError) throw new ApiError(500, 'pending_account_lookup_failed', 'Erro ao selecionar conta Instagram.')
  if (!pending) throw new ApiError(404, 'pending_account_not_found', 'Conta Instagram nao encontrada.')
  if (new Date(pending.expires_at).getTime() < Date.now()) {
    throw new ApiError(410, 'pending_account_expired', 'A selecao expirou. Conecte o Instagram novamente.')
  }

  const accountName = pending.instagram_username || pending.facebook_page_name
  const { data: integration, error: upsertError } = await admin
    .from('workspace_integrations')
    .upsert(
      {
        workspace_id: workspaceId,
        platform: 'instagram',
        user_id: user.id,
        access_token: null,
        account_id: pending.instagram_business_account_id,
        account_name: accountName,
        status: 'connected',
        metadata: {
          source: 'meta_oauth',
          facebook_page_id: pending.facebook_page_id,
          facebook_page_name: pending.facebook_page_name,
          instagram_username: pending.instagram_username,
          connected_at: new Date().toISOString(),
        },
        meta_user_id: pending.meta_user_id,
        facebook_page_id: pending.facebook_page_id,
        facebook_page_name: pending.facebook_page_name,
        page_access_token_encrypted: pending.page_access_token_encrypted,
        instagram_business_account_id: pending.instagram_business_account_id,
        token_expires_at: pending.token_expires_at,
        permissions: pending.permissions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,platform' },
    )
    .select('id,status,account_id,account_name,facebook_page_id,facebook_page_name,instagram_business_account_id,token_expires_at,permissions,updated_at')
    .single()

  if (upsertError) throw new ApiError(500, 'integration_save_failed', 'Erro ao salvar integracao Instagram.')

  await admin
    .from('meta_pending_instagram_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)

  console.info('[meta-instagram-accounts] Integracao conectada', {
    user_id: user.id,
    workspace_id: workspaceId,
    facebook_page_id: pending.facebook_page_id,
    instagram_business_account_id: pending.instagram_business_account_id,
  })

  return json({ integration })
}
