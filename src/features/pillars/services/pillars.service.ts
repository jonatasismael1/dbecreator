import { supabase } from '@/lib/supabase/client'
import type { ContentPillar, CreatePillarDTO, UpdatePillarDTO } from '../types/pillar.types'

const TABLE = 'content_pillars'

export const pillarsService = {
  async getAll(workspaceId: string): Promise<ContentPillar[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async create(workspaceId: string, dto: CreatePillarDTO): Promise<ContentPillar> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...dto, workspace_id: workspaceId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(workspaceId: string, id: string, dto: UpdatePillarDTO): Promise<ContentPillar> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(dto)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('workspace_id', workspaceId)
    if (error) throw error
  },

  async reorder(items: Array<{ id: string; position: number }>): Promise<void> {
    for (const item of items) {
      await supabase.from(TABLE).update({ position: item.position }).eq('id', item.id)
    }
  },
}
