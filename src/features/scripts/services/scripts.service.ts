import { supabase } from '@/lib/supabase/client'
import type { CreateScriptDTO, Script, ScriptVersion, UpdateScriptDTO } from '../types/script.types'

const TABLE = 'scripts'
const SELECT_COLUMNS = '*, content_pillars(id,title,color,type), campaigns(id,title,status)'

export const scriptsService = {
  async getAll(workspaceId: string): Promise<Script[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Script[]
  },

  async create(workspaceId: string, dto: CreateScriptDTO): Promise<Script> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...dto, workspace_id: workspaceId })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return data as Script
  },

  async update(workspaceId: string, id: string, dto: UpdateScriptDTO): Promise<Script> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return data as Script
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw error
  },

  async archive(workspaceId: string, id: string): Promise<Script> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return data as Script
  },

  async restore(workspaceId: string, id: string): Promise<Script> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ archived_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return data as Script
  },

  async getVersions(workspaceId: string, scriptId: string): Promise<ScriptVersion[]> {
    const { data, error } = await supabase
      .from('script_versions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('script_id', scriptId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return (data ?? []) as ScriptVersion[]
  },
}
