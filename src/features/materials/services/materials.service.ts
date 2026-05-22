import { supabase } from '@/lib/supabase/client'
import type { Material, CreateMaterialDTO, UpdateMaterialDTO } from '../types/material.types'

const TABLE = 'materials'

export const materialsService = {
  async getByWorkspace(workspaceId: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(workspaceId: string, dto: CreateMaterialDTO): Promise<Material> {
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

  async update(workspaceId: string, id: string, dto: UpdateMaterialDTO): Promise<Material> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
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
}
