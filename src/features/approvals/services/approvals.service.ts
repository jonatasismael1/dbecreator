import { supabase } from '@/lib/supabase/client'
import type { Approval, ApprovalComment, ApprovalCommentSection, CreateApprovalDTO } from '../types/approval.types'

const TABLE = 'approvals'
const COMMENTS_TABLE = 'approval_comments'

export const approvalsService = {
  // --- Workspace Methods (Authenticated) ---
  
  async getByWorkspace(workspaceId: string): Promise<Approval[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        script:scripts(*, campaigns(id,title))
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(workspaceId: string, dto: CreateApprovalDTO): Promise<Approval> {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) throw new Error('Sessao expirada. Entre novamente para gerar o link.')

    const response = await fetch('/api/approvals/generate-link', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        script_id: dto.script_id,
        client_name: dto.client_name,
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.message || 'Nao foi possivel gerar o link. Tente novamente.')
    }

    if (!payload?.approval) throw new Error('Resposta invalida ao gerar link de aprovacao.')
    return payload.approval as Approval
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (error) throw error
  },

  // --- Public Methods (Anonymous via Token) ---

  async getByToken(token: string): Promise<Approval> {
    const response = await fetch(`/api/public-approval?token=${encodeURIComponent(token)}`)
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Link de aprovação inválido.')
    return response.json()
  },

  async updateStatusByToken(
    token: string,
    action: 'approve' | 'request_changes',
    payload: { authorName?: string; comment?: string } = {},
  ): Promise<Approval> {
    const response = await fetch(`/api/public-approval?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action,
        author_name: payload.authorName,
        comment: payload.comment,
      }),
    })

    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Não foi possível atualizar a aprovação.')
    return response.json()
  },

  async getComments(approvalId: string): Promise<ApprovalComment[]> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .select('*')
      .eq('approval_id', approvalId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async addComment(
    approvalId: string,
    authorName: string,
    content: string,
    section: ApprovalCommentSection = 'GERAL',
  ): Promise<ApprovalComment> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .insert({
        approval_id: approvalId,
        author_name: authorName,
        content,
        section,
      })
      .select()
      .single()

    if (error) throw error
    return data as ApprovalComment
  },

  async resolveComment(commentId: string, resolved: boolean): Promise<void> {
    const { error } = await supabase
      .from(COMMENTS_TABLE)
      .update({ resolved })
      .eq('id', commentId)
    if (error) throw error
  },
}
