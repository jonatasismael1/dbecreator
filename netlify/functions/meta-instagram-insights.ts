import { decryptToken, encryptToken } from './_shared/crypto'
import { getInstagramInsights, refreshLongLivedInstagramToken } from './_shared/meta'
import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'
import { getWorkspaceId, requireAuth, requireWorkspaceMember } from './_shared/supabase'

export const config = {
  path: '/api/meta/instagram-insights',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return methodNotAllowed()

    const url = new URL(request.url)
    const workspaceId = getWorkspaceId(url)
    const { user, admin } = await requireAuth(request)
    await requireWorkspaceMember(admin, workspaceId, user.id)

    const { data: integration, error } = await admin
      .from('workspace_integrations')
      .select('id,status,page_access_token_encrypted,instagram_business_account_id,account_name,facebook_page_name,token_expires_at,metadata')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw new ApiError(500, 'integration_lookup_failed', 'Erro ao consultar integracao Instagram.')
    if (!integration || integration.status !== 'connected') {
      throw new ApiError(409, 'integration_not_connected', 'Instagram ainda nao esta conectado.')
    }
    if (!integration.instagram_business_account_id) {
      throw new ApiError(409, 'instagram_account_missing', 'Integracao sem Instagram Business Account salvo.')
    }
    if (integration.token_expires_at && new Date(integration.token_expires_at).getTime() < Date.now()) {
      throw new ApiError(401, 'token_expired', 'Token da Meta expirado. Reconecte o Instagram.')
    }

    let instagramAccessToken = decryptToken(integration.page_access_token_encrypted)
    let tokenExpiresAt = integration.token_expires_at as string | null
    let tokenRefreshedAt = typeof integration.metadata?.token_refreshed_at === 'string'
      ? integration.metadata.token_refreshed_at
      : null

    if (shouldRefreshInstagramToken(tokenExpiresAt)) {
      const refreshed = await refreshLongLivedInstagramToken(instagramAccessToken)
      instagramAccessToken = refreshed.access_token
      tokenExpiresAt = refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : tokenExpiresAt
      tokenRefreshedAt = new Date().toISOString()

      await admin
        .from('workspace_integrations')
        .update({
          page_access_token_encrypted: encryptToken(instagramAccessToken),
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(integration.metadata ?? {}),
            token_refreshed_at: tokenRefreshedAt,
          },
        })
        .eq('id', integration.id)

      await admin
        .from('profiles')
        .update({
          ig_access_token: encryptToken(instagramAccessToken),
          ig_token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      console.info('[meta-instagram-insights] Token Instagram renovado', {
        user_id: user.id,
        workspace_id: workspaceId,
        integration_id: integration.id,
        token_expires_at: tokenExpiresAt,
      })
    }

    console.info('[meta-instagram-insights] Buscando insights com token salvo da integracao', {
      user_id: user.id,
      workspace_id: workspaceId,
      integration_id: integration.id,
      instagram_business_account_id: integration.instagram_business_account_id,
      token_expires_at: tokenExpiresAt,
    })

    const insights = await getInstagramInsights(integration.instagram_business_account_id, instagramAccessToken)

    await admin
      .from('workspace_integrations')
      .update({
        metadata: {
          ...(integration.metadata ?? {}),
          last_insights_sync_at: insights.synced_at,
          last_insights_metrics: insights.metrics,
          last_insights_metric_errors: insights.metric_errors,
          token_refreshed_at: tokenRefreshedAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)

    console.info('[meta-instagram-insights] Insights sincronizados', {
      user_id: user.id,
      workspace_id: workspaceId,
      integration_id: integration.id,
      synced_at: insights.synced_at,
    })

    return json({
      integration: {
        id: integration.id,
        account_name: integration.account_name,
        facebook_page_name: integration.facebook_page_name,
        instagram_business_account_id: integration.instagram_business_account_id,
        token_expires_at: tokenExpiresAt,
      },
      ...insights,
    })
  } catch (error) {
    return handleError(error, 'meta-instagram-insights')
  }
}

function shouldRefreshInstagramToken(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const refreshWindowMs = 7 * 24 * 60 * 60 * 1000
  return new Date(expiresAt).getTime() - Date.now() < refreshWindowMs
}
