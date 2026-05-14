import { supabase } from '@/lib/supabase/client'
import type { Approval, CreateApprovalDTO, ApprovalComment } from '../types/approval.types'

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
    const { data: user } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        ...dto,
        workspace_id: workspaceId,
        created_by: user.user?.id,
      })
      .select()
      .single()

    if (error) throw error

    const { error: scriptError } = await supabase
      .from('scripts')
      .update({ status: 'in_approval', updated_at: new Date().toISOString() })
      .eq('id', dto.script_id)
      .eq('workspace_id', workspaceId)

    if (scriptError) throw scriptError

    return data
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

  async addComment(approvalId: string, authorName: string, content: string): Promise<ApprovalComment> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .insert({
        approval_id: approvalId,
        author_name: authorName,
        content
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}
