import { encryptToken } from './_shared/crypto'
import { exchangeCodeForLongLivedToken, getConnectableInstagramAccounts, getMetaUserId } from './_shared/meta'
import { ApiError, handleError, redirectToApp } from './_shared/responses'
import { getAdminClient } from './_shared/supabase'

export const config = {
  path: '/api/meta/callback',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return redirectToApp('/settings?meta_error=method_not_allowed')

    const url = new URL(request.url)
    const deniedError = url.searchParams.get('error') || url.searchParams.get('error_reason')
    if (deniedError) {
      const message = url.searchParams.get('error_description') || 'Usuario negou as permissoes da Meta.'
      console.warn('[meta-callback] OAuth recusado', { error: deniedError })
      return redirectToApp(`/settings?meta_error=user_denied_permissions&meta_message=${encodeURIComponent(message)}`)
    }

    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) {
      throw new ApiError(400, 'invalid_callback', 'Callback da Meta sem code ou state.')
    }

    const admin = getAdminClient()
    const { data: oauthState, error: stateError } = await admin
      .from('meta_oauth_states')
      .select('state,user_id,workspace_id,redirect_to,expires_at')
      .eq('state', state)
      .maybeSingle()

    if (stateError) throw new ApiError(500, 'oauth_state_lookup_failed', 'Erro ao validar autenticacao Meta.')
    if (!oauthState) throw new ApiError(400, 'invalid_oauth_state', 'State OAuth invalido ou expirado.')
    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      await admin.from('meta_oauth_states').delete().eq('state', state)
      throw new ApiError(400, 'expired_oauth_state', 'State OAuth expirado. Tente conectar novamente.')
    }

    const token = await exchangeCodeForLongLivedToken(code)
    const tokenExpiresAt = token.expiresIn
      ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
      : null
    const metaUserId = await getMetaUserId(token.accessToken)
    const accounts = await getConnectableInstagramAccounts(token.accessToken, metaUserId, tokenExpiresAt)

    await admin
      .from('meta_pending_instagram_accounts')
      .delete()
      .eq('user_id', oauthState.user_id)
      .eq('workspace_id', oauthState.workspace_id)

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const { error: insertError } = await admin.from('meta_pending_instagram_accounts').insert(
      accounts.map((account) => ({
        user_id: oauthState.user_id,
        workspace_id: oauthState.workspace_id,
        meta_user_id: account.meta_user_id,
        facebook_page_id: account.facebook_page_id,
        facebook_page_name: account.facebook_page_name,
        page_access_token_encrypted: encryptToken(account.page_access_token),
        instagram_business_account_id: account.instagram_business_account_id,
        instagram_username: account.instagram_username,
        permissions: account.permissions,
        token_expires_at: account.token_expires_at,
        expires_at: expiresAt,
      })),
    )

    if (insertError) throw new ApiError(500, 'pending_accounts_save_failed', 'Erro ao salvar contas encontradas.')

    await admin.from('meta_oauth_states').delete().eq('state', state)
    console.info('[meta-callback] Contas Instagram elegiveis encontradas', {
      user_id: oauthState.user_id,
      workspace_id: oauthState.workspace_id,
      accounts: accounts.length,
    })

    return redirectToApp(oauthState.redirect_to || '/settings?instagram=select')
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn('[meta-callback]', { code: error.code, message: error.message })
      return redirectToApp(`/settings?meta_error=${encodeURIComponent(error.code)}&meta_message=${encodeURIComponent(error.message)}`)
    }

    return handleError(error, 'meta-callback')
  }
}
