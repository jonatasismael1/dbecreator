import { buildPublicApprovalUrl, assertUuid, normalizeClientName } from './_shared/approval-links'
import { requireAuth, requireWorkspaceMember } from './_shared/supabase'
import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/api/approvals/generate-link',
}

const REQUEST_TIMEOUT_MS = 10_000

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed()

  try {
    const { user, admin } = await requireAuth(request)
    const body = await request.json().catch(() => ({}))
    const scriptId = assertUuid(body?.script_id, 'script_id')
    const clientName = normalizeClientName(body?.client_name)
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

    const { data: script, error: scriptError } = await admin
      .from('scripts')
      .select('id, workspace_id, status')
      .eq('id', scriptId)
      .maybeSingle()
      .abortSignal(signal)

    if (scriptError) throw new ApiError(500, 'script_lookup_failed', 'Nao foi possivel localizar o roteiro.')
    if (!script) throw new ApiError(404, 'script_not_found', 'Roteiro nao encontrado.')

    await requireWorkspaceMember(admin, script.workspace_id, user.id)

    const now = new Date().toISOString()
    const { data: existing, error: existingError } = await admin
      .from('approvals')
      .select('*')
      .eq('workspace_id', script.workspace_id)
      .eq('script_id', scriptId)
      .eq('status', 'pending')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .abortSignal(signal)

    if (existingError) {
      throw new ApiError(500, 'approval_lookup_failed', 'Nao foi possivel verificar links existentes.')
    }

    const approval = existing ?? await createApproval()

    if (script.status !== 'in_approval') {
      const { error: updateScriptError } = await admin
        .from('scripts')
        .update({ status: 'in_approval', updated_at: new Date().toISOString() })
        .eq('id', scriptId)
        .eq('workspace_id', script.workspace_id)
        .abortSignal(signal)

      if (updateScriptError) {
        throw new ApiError(500, 'script_status_update_failed', 'O link foi criado, mas nao foi possivel atualizar o status do roteiro.')
      }
    }

    return json({
      success: true,
      approval,
      approval_id: approval.id,
      public_url: buildPublicApprovalUrl(approval.token, request.url),
      expires_at: approval.expires_at,
      reused: Boolean(existing),
    })

    async function createApproval() {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await admin
        .from('approvals')
        .insert({
          workspace_id: script.workspace_id,
          script_id: scriptId,
          client_name: clientName,
          client_email: null,
          expires_at: expiresAt,
          created_by: user.id,
        })
        .select('*')
        .single()
        .abortSignal(signal)

      if (error) throw new ApiError(500, 'approval_create_failed', 'Nao foi possivel gerar o link. Tente novamente.')
      return data
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return json({ error: 'request_timeout', message: 'Nao foi possivel gerar o link a tempo. Tente novamente.' }, 504)
    }

    return handleError(error, 'approval-generate-link')
  }
}
