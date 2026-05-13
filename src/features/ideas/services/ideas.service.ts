import { supabase } from '@/lib/supabase/client'
import type { CreateIdeaDTO, Idea, UpdateIdeaDTO } from '../types/idea.types'

const TABLE = 'ideas'

export const ideasService = {
  async getAll(workspaceId: string): Promise<Idea[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async create(workspaceId: string, userId: string, dto: CreateIdeaDTO): Promise<Idea> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        ...dto,
        workspace_id: workspaceId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, dto: UpdateIdeaDTO): Promise<Idea> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
