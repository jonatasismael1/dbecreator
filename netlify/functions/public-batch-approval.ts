import { getAdminClient } from './_shared/supabase'
import { ApiError, handleError, json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/api/public-batch-approval',
}

type BatchAction = 'approve_all' | 'approve_selected' | 'approve_item' | 'request_changes_item' | 'add_section_comment'
type BatchItemStatus = 'pending' | 'approved' | 'requested_changes'
type BatchStatus = 'pending' | 'approved' | 'partially_approved' | 'requested_changes'
type CommentSection = 'GANCHO' | 'DESENVOLVIMENTO' | 'CTA'

interface PublicApprovalComment {
  id: string
  approval_id: string
  author_name: string
  content: string
  section: CommentSection | 'GERAL'
  resolved: boolean
  created_at: string
}

interface PublicBatchItem {
  id: string
  script_id: string
  status: BatchItemStatus
  client_feedback: string | null
  comments?: PublicApprovalComment[]
}

interface PublicBatchApproval {
  id: string
  workspace_id: string
  status: BatchStatus
  client_name: string | null
  expires_at: string | null
  items: PublicBatchItem[]
}

export default async function handler(request: Request): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method)) return methodNotAllowed()

  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')?.trim()
    if (!token) throw new ApiError(400, 'missing_token', 'Token de aprovacao nao informado.')

    const admin = getAdminClient()

    if (request.method === 'GET') {
      return json(await getPublicBatchApproval(admin, token))
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action as BatchAction | undefined
    const itemId = body?.item_id as string | undefined
    const itemIds = Array.isArray(body?.item_ids) ? body.item_ids.filter((id: unknown): id is string => typeof id === 'string') : []
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : ''
    const section = body?.section as CommentSection | undefined
    const authorName = typeof body?.author_name === 'string' && body.author_name.trim()
      ? body.author_name.trim()
      : 'Cliente'

    if (!['approve_all', 'approve_selected', 'approve_item', 'request_changes_item', 'add_section_comment'].includes(action || '')) {
      throw new ApiError(400, 'invalid_action', 'Acao de aprovacao invalida.')
    }

    if ((action === 'request_changes_item' || action === 'add_section_comment') && !comment) {
      throw new ApiError(400, 'missing_comment', 'Informe a observacao para solicitar ajuste.')
    }

    const batch = await getPublicBatchApproval(admin, token)

    if (action === 'approve_all' || action === 'approve_selected') {
      if (action === 'approve_selected' && itemIds.length === 0) {
        throw new ApiError(400, 'missing_item_ids', 'Selecione ao menos um roteiro para aprovar.')
      }

      const selectedIds = new Set(itemIds)
      const targetItems = batch.items.filter((item) =>
        item.status === 'pending' && (action === 'approve_all' || selectedIds.has(item.id)),
      )

      if (targetItems.length === 0 || (action === 'approve_selected' && targetItems.length !== selectedIds.size)) {
        throw new ApiError(409, 'items_already_reviewed', 'Um ou mais roteiros selecionados ja foram revisados.')
      }

      await approveBatchItems(admin, batch, targetItems)
    } else if (action === 'add_section_comment') {
      if (!itemId) throw new ApiError(400, 'missing_item_id', 'ID do roteiro nao informado.')
      if (!section || !['GANCHO', 'DESENVOLVIMENTO', 'CTA'].includes(section)) {
        throw new ApiError(400, 'invalid_section', 'Secao do comentario invalida.')
      }

      const item = batch.items.find((batchItem) => batchItem.id === itemId)
      if (!item) throw new ApiError(404, 'item_not_found', 'Roteiro nao encontrado neste lote.')
      if (item.status !== 'pending') {
        throw new ApiError(409, 'item_already_reviewed', 'Este roteiro ja foi revisado.')
      }

      const approvalId = await getOrCreateScriptApprovalContext(admin, {
        batchId: batch.id,
        itemId: item.id,
        workspaceId: batch.workspace_id,
        scriptId: item.script_id,
        clientName: batch.client_name,
        expiresAt: batch.expires_at,
      })

      const { error: commentError } = await admin
        .from('approval_comments')
        .insert({
          approval_id: approvalId,
          author_name: authorName,
          content: comment,
          section,
        })

      if (commentError) throw new ApiError(500, 'comment_insert_failed', 'Nao foi possivel salvar o comentario.')
    } else if (action === 'approve_item' || action === 'request_changes_item') {
      if (!itemId) throw new ApiError(400, 'missing_item_id', 'ID do roteiro nao informado.')

      const item = batch.items.find((batchItem) => batchItem.id === itemId)
      if (!item) throw new ApiError(404, 'item_not_found', 'Roteiro nao encontrado neste lote.')
      if (item.status !== 'pending') {
        throw new ApiError(409, 'item_already_reviewed', 'Este roteiro ja foi revisado.')
      }

      const itemStatus: BatchItemStatus = action === 'approve_item' ? 'approved' : 'requested_changes'
      const scriptStatus = action === 'approve_item' ? 'approved' : 'changes_requested'

      const { error: itemError } = await admin
        .from('approval_batch_items')
        .update({
          status: itemStatus,
          client_feedback: comment || item.client_feedback,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('batch_id', batch.id)
        .eq('status', 'pending')

      if (itemError) throw new ApiError(500, 'item_update_failed', 'Erro ao atualizar roteiro.')

      const { error: scriptError } = await admin
        .from('scripts')
        .update({ status: scriptStatus, updated_at: new Date().toISOString() })
        .eq('id', item.script_id)
        .eq('workspace_id', batch.workspace_id)

      if (scriptError) throw new ApiError(500, 'script_update_failed', 'Erro ao atualizar status do roteiro.')

      const updatedBatchItems = batch.items.map((batchItem) => batchItem.id === itemId ? { ...batchItem, status: itemStatus } : batchItem)
      const allApproved = updatedBatchItems.every((batchItem) => batchItem.status === 'approved')
      const allReviewed = updatedBatchItems.every((batchItem) => batchItem.status !== 'pending')
      const hasRequestedChanges = updatedBatchItems.some((batchItem) => batchItem.status === 'requested_changes')

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
          .eq('workspace_id', batch.workspace_id)
      }
    }

    return json(await getPublicBatchApproval(admin, token))
  } catch (error) {
    return handleError(error, 'public-batch-approval')
  }
}

async function approveBatchItems(
  admin: ReturnType<typeof getAdminClient>,
  batch: PublicBatchApproval,
  items: PublicBatchItem[],
) {
  const now = new Date().toISOString()
  const { error: itemsError } = await admin
    .from('approval_batch_items')
    .update({ status: 'approved', reviewed_at: now })
    .eq('batch_id', batch.id)
    .eq('status', 'pending')
    .in('id', items.map((item) => item.id))

  if (itemsError) throw new ApiError(500, 'items_update_failed', 'Erro ao aprovar roteiros.')

  const { error: scriptsError } = await admin
    .from('scripts')
    .update({ status: 'approved', updated_at: now })
    .eq('workspace_id', batch.workspace_id)
    .in('id', items.map((item) => item.script_id))

  if (scriptsError) throw new ApiError(500, 'scripts_update_failed', 'Erro ao atualizar status dos roteiros.')

  const approvedIds = new Set(items.map((item) => item.id))
  const updatedBatchItems = batch.items.map((item) => (
    approvedIds.has(item.id) ? { ...item, status: 'approved' as BatchItemStatus } : item
  ))
  const allApproved = updatedBatchItems.every((item) => item.status === 'approved')
  const allReviewed = updatedBatchItems.every((item) => item.status !== 'pending')
  const hasRequestedChanges = updatedBatchItems.some((item) => item.status === 'requested_changes')
  const newBatchStatus: BatchStatus = allApproved
    ? 'approved'
    : allReviewed || hasRequestedChanges
      ? 'partially_approved'
      : batch.status

  if (newBatchStatus !== batch.status) {
    const { error: batchError } = await admin
      .from('approval_batches')
      .update({ status: newBatchStatus, updated_at: now })
      .eq('id', batch.id)
      .eq('workspace_id', batch.workspace_id)

    if (batchError) throw new ApiError(500, 'batch_update_failed', 'Erro ao atualizar status do lote.')
  }
}

async function getPublicBatchApproval(admin: ReturnType<typeof getAdminClient>, token: string): Promise<PublicBatchApproval> {
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
      workspace:workspaces(name,logo_url),
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

  if (error) throw new ApiError(500, 'batch_lookup_failed', 'Erro ao buscar aprovacao em lote.')
  if (!data) throw new ApiError(404, 'batch_not_found', 'Link de aprovacao invalido.')

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new ApiError(410, 'batch_expired', 'Este link de aprovacao expirou.')
  }

  const batch = data as PublicBatchApproval
  const scriptIds = batch.items.map((item) => item.script_id).filter(Boolean)

  if (scriptIds.length === 0) return batch

  const contextMarkers = batch.items.map((item) => buildBatchApprovalContextMarker(batch.id, item.id))
  const { data: approvalContexts, error: approvalsError } = await admin
    .from('approvals')
    .select(`
      id,
      script_id,
      client_email,
      comments:approval_comments(id,approval_id,author_name,content,section,resolved,created_at)
    `)
    .eq('workspace_id', batch.workspace_id)
    .in('client_email', contextMarkers)

  if (approvalsError) throw new ApiError(500, 'comments_lookup_failed', 'Erro ao buscar comentarios da aprovacao.')

  const commentsByContextMarker = new Map<string, PublicApprovalComment[]>()
  for (const approval of approvalContexts ?? []) {
    const comments = (approval.comments ?? []) as PublicApprovalComment[]
    commentsByContextMarker.set(approval.client_email, [
      ...(commentsByContextMarker.get(approval.client_email) ?? []),
      ...comments,
    ])
  }

  batch.items = batch.items.map((item) => ({
    ...item,
    comments: (commentsByContextMarker.get(buildBatchApprovalContextMarker(batch.id, item.id)) ?? []).sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  }))

  return batch
}

async function getOrCreateScriptApprovalContext(
  admin: ReturnType<typeof getAdminClient>,
  params: { batchId: string; itemId: string; workspaceId: string; scriptId: string; clientName: string | null; expiresAt: string | null },
): Promise<string> {
  const contextMarker = buildBatchApprovalContextMarker(params.batchId, params.itemId)

  const { data: existing, error: existingError } = await admin
    .from('approvals')
    .select('id')
    .eq('workspace_id', params.workspaceId)
    .eq('script_id', params.scriptId)
    .eq('client_email', contextMarker)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) throw new ApiError(500, 'approval_context_lookup_failed', 'Erro ao localizar contexto de aprovacao.')
  if (existing?.id) return existing.id

  const { data: created, error: createError } = await admin
    .from('approvals')
    .insert({
      workspace_id: params.workspaceId,
      script_id: params.scriptId,
      client_name: params.clientName,
      client_email: contextMarker,
      expires_at: params.expiresAt,
    })
    .select('id')
    .single()

  if (createError) throw new ApiError(500, 'approval_context_create_failed', 'Erro ao criar contexto de comentario.')
  return created.id
}

function buildBatchApprovalContextMarker(batchId: string, itemId: string) {
  return `batch:${batchId}:${itemId}`
}
