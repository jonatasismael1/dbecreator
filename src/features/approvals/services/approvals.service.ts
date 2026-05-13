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
        script:scripts(*)
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
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },

  // --- Public Methods (Anonymous via Token) ---

  async getByToken(token: string): Promise<Approval> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        script:scripts(title, hook, body, cta)
      `)
      .eq('token', token)
      .single()

    if (error) throw error
    return data
  },

  async updateStatusByToken(token: string, status: 'approved' | 'requested_changes'): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('token', token)

    if (error) throw error
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
