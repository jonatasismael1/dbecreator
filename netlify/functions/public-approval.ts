import { getAdminClient } from './_shared/supabase'
import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/api/public-approval',
}

type PublicApprovalAction = 'approve' | 'request_changes'

export default async function handler(request: Request): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method)) return methodNotAllowed()

  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')?.trim()
    if (!token) throw new ApiError(400, 'missing_token', 'Token de aprovação não informado.')

    const admin = getAdminClient()

    if (request.method === 'GET') {
      return json(await getPublicApproval(admin, token))
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action as PublicApprovalAction | undefined
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : ''
    const authorName = typeof body?.author_name === 'string' && body.author_name.trim()
      ? body.author_name.trim()
      : 'Cliente'

    if (action !== 'approve' && action !== 'request_changes') {
      throw new ApiError(400, 'invalid_action', 'Ação de aprovação inválida.')
    }

    if (action === 'request_changes' && !comment) {
      throw new ApiError(400, 'missing_comment', 'Informe a observação para solicitar ajuste.')
    }

    const approval = await getPublicApproval(admin, token)
    const approvalStatus = action === 'approve' ? 'approved' : 'requested_changes'
    const scriptStatus = action === 'approve' ? 'approved' : 'changes_requested'

    const { error: approvalError } = await admin
      .from('approvals')
      .update({ status: approvalStatus, updated_at: new Date().toISOString() })
      .eq('id', approval.id)

    if (approvalError) {
      throw new ApiError(500, 'approval_update_failed', 'Não foi possível atualizar a aprovação.')
    }

    const { error: scriptError } = await admin
      .from('scripts')
      .update({ status: scriptStatus, updated_at: new Date().toISOString() })
      .eq('id', approval.script_id)

    if (scriptError) {
      throw new ApiError(500, 'script_update_failed', 'Não foi possível atualizar o status do roteiro.')
    }

    if (comment) {
      const { error: commentError } = await admin
        .from('approval_comments')
        .insert({
          approval_id: approval.id,
          author_name: authorName,
          content: comment,
        })

      if (commentError) {
        throw new ApiError(500, 'comment_insert_failed', 'Não foi possível salvar a observação.')
      }
    }

    return json(await getPublicApproval(admin, token))
  } catch (error) {
    return handleError(error, 'public-approval')
  }
}

async function getPublicApproval(admin: ReturnType<typeof getAdminClient>, token: string) {
  const { data, error } = await admin
    .from('approvals')
    .select(`
      id,
      workspace_id,
      script_id,
      token,
      status,
      client_name,
      expires_at,
      created_at,
      script:scripts(
        id,
        title,
        hook,
        body,
        cta,
        status,
        campaign:campaigns(id,title)
      ),
      comments:approval_comments(id,author_name,content,created_at)
    `)
    .eq('token', token)
    .maybeSingle()

  if (error) throw new ApiError(500, 'approval_lookup_failed', 'Erro ao buscar aprovação.')
  if (!data) throw new ApiError(404, 'approval_not_found', 'Link de aprovação inválido.')

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new ApiError(410, 'approval_expired', 'Este link de aprovação expirou.')
  }

  return data
}
