import { getAdminClient } from './_shared/supabase'
import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/api/public-batch-approval',
}

type BatchAction = 'approve_all' | 'approve_item' | 'request_changes_item'

export default async function handler(request: Request): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method)) return methodNotAllowed()

  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')?.trim()
    if (!token) throw new ApiError(400, 'missing_token', 'Token de aprovação não informado.')

    const admin = getAdminClient()

    if (request.method === 'GET') {
      return json(await getPublicBatchApproval(admin, token))
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action as BatchAction | undefined
    const itemId = body?.item_id as string | undefined
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : ''
    const authorName = typeof body?.author_name === 'string' && body.author_name.trim()
      ? body.author_name.trim()
      : 'Cliente'

    if (!['approve_all', 'approve_item', 'request_changes_item'].includes(action || '')) {
      throw new ApiError(400, 'invalid_action', 'Ação de aprovação inválida.')
    }

    if (action === 'request_changes_item' && !comment) {
      throw new ApiError(400, 'missing_comment', 'Informe a observação para solicitar ajuste.')
    }

    const batch = await getPublicBatchApproval(admin, token)

    if (action === 'approve_all') {
      const pendingItems = batch.items.filter((i: any) => i.status === 'pending')
      
      if (pendingItems.length > 0) {
        // Update all pending items to approved
        const { error: itemsError } = await admin
          .from('approval_batch_items')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .in('id', pendingItems.map((i: any) => i.id))
        
        if (itemsError) throw new ApiError(500, 'items_update_failed', 'Erro ao aprovar roteiros.')

        // Update corresponding scripts
        const { error: scriptsError } = await admin
          .from('scripts')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .in('id', pendingItems.map((i: any) => i.script_id))
        
        if (scriptsError) throw new ApiError(500, 'scripts_update_failed', 'Erro ao atualizar status dos roteiros.')
      }

      // Update batch status
      const hasRequestedChanges = batch.items.some((i: any) => i.status === 'requested_changes')
      const newBatchStatus = hasRequestedChanges ? 'partially_approved' : 'approved'

      await admin
        .from('approval_batches')
        .update({ status: newBatchStatus, updated_at: new Date().toISOString() })
        .eq('id', batch.id)

    } else if (action === 'approve_item' || action === 'request_changes_item') {
      if (!itemId) throw new ApiError(400, 'missing_item_id', 'ID do roteiro não informado.')
      
      const item = batch.items.find((i: any) => i.id === itemId)
      if (!item) throw new ApiError(404, 'item_not_found', 'Roteiro não encontrado neste lote.')

      const itemStatus = action === 'approve_item' ? 'approved' : 'requested_changes'
      const scriptStatus = action === 'approve_item' ? 'approved' : 'changes_requested'

      const { error: itemError } = await admin
        .from('approval_batch_items')
        .update({ 
          status: itemStatus, 
          client_feedback: comment || item.client_feedback,
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', item.id)

      if (itemError) throw new ApiError(500, 'item_update_failed', 'Erro ao atualizar roteiro.')

      const { error: scriptError } = await admin
        .from('scripts')
        .update({ status: scriptStatus, updated_at: new Date().toISOString() })
        .eq('id', item.script_id)

      if (scriptError) throw new ApiError(500, 'script_update_failed', 'Erro ao atualizar status do roteiro.')

      // Refresh batch to check new overall status
      const updatedBatchItems = batch.items.map((i: any) => i.id === itemId ? { ...i, status: itemStatus } : i)
      const allApproved = updatedBatchItems.every((i: any) => i.status === 'approved')
      const allReviewed = updatedBatchItems.every((i: any) => i.status !== 'pending')
      const hasRequestedChanges = updatedBatchItems.some((i: any) => i.status === 'requested_changes')
      
      let newBatchStatus = batch.status
      if (allApproved) {
        newBatchStatus = 'approved'
      } else if (allReviewed || hasRequestedChanges) {
        newBatchStatus = hasRequestedChanges ? 'partially_approved' : 'approved'
      }

      if (newBatchStatus !== batch.status) {
        await admin
          .from('approval_batches')
          .update({ status: newBatchStatus, updated_at: new Date().toISOString() })
          .eq('id', batch.id)
      }
    }

    return json(await getPublicBatchApproval(admin, token))
  } catch (error) {
    return handleError(error, 'public-batch-approval')
  }
}

async function getPublicBatchApproval(admin: ReturnType<typeof getAdminClient>, token: string) {
  const { data, error } = await admin
    .from('approval_batches')
    .select(`
      id,
      workspace_id,
      campaign_id,
      token,
      status,
      client_name,
      expires_at,
      created_at,
      campaign:campaigns(id,title,description,goal),
      items:approval_batch_items(
        id,
        status,
        client_feedback,
        reviewed_at,
        script_id,
        script:scripts(
          id,
          title,
          hook,
          body,
          cta,
          status
        )
      )
    `)
    .eq('token', token)
    .maybeSingle()

  if (error) throw new ApiError(500, 'batch_lookup_failed', 'Erro ao buscar aprovação em lote.')
  if (!data) throw new ApiError(404, 'batch_not_found', 'Link de aprovação inválido.')

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new ApiError(410, 'batch_expired', 'Este link de aprovação expirou.')
  }

  return data
}
