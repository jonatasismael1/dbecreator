import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'
import { getWorkspaceId, requireAuth, requireWorkspaceMember } from './_shared/supabase'

export const config = {
  path: '/api/meta/pages',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return methodNotAllowed()

    const url = new URL(request.url)
    const workspaceId = getWorkspaceId(url)
    const { user, admin } = await requireAuth(request)
    await requireWorkspaceMember(admin, workspaceId, user.id)

    const { data, error } = await admin
      .from('meta_pending_instagram_accounts')
      .select('facebook_page_id,facebook_page_name,instagram_business_account_id,instagram_username,permissions,expires_at')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw new ApiError(500, 'pages_lookup_failed', 'Erro ao listar Paginas encontradas.')

    const pages = new Map<string, unknown>()
    for (const row of data ?? []) {
      pages.set(row.facebook_page_id, {
        facebook_page_id: row.facebook_page_id,
        facebook_page_name: row.facebook_page_name,
        has_instagram_business_account: true,
        instagram_business_account_id: row.instagram_business_account_id,
        instagram_username: row.instagram_username,
        permissions: row.permissions,
        expires_at: row.expires_at,
      })
    }

    return json({ pages: Array.from(pages.values()) })
  } catch (error) {
    return handleError(error, 'meta-pages')
  }
}
