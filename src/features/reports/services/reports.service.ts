import { supabase } from '@/lib/supabase/client'
import type { PerformanceMetric, CreateMetricDTO, UpdateMetricDTO } from '../types/report.types'

const TABLE = 'performance_metrics'

export const reportsService = {
  async getByWorkspace(workspaceId: string): Promise<PerformanceMetric[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        script:scripts(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('published_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(workspaceId: string, dto: CreateMetricDTO): Promise<PerformanceMetric> {
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

  async update(workspaceId: string, id: string, dto: UpdateMetricDTO): Promise<PerformanceMetric> {
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
