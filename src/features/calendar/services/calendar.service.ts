import { supabase } from '@/lib/supabase/client'
import type { CalendarItem, CreateCalendarItemDTO, UpdateCalendarItemDTO } from '../types/calendar.types'

const TABLE = 'calendar_items'
const SELECT_COLUMNS = '*, scripts(id,title,status,last_analysis_score)'

export const calendarService = {
  async getAll(workspaceId: string): Promise<CalendarItem[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq('workspace_id', workspaceId)
      .order('publish_date', { ascending: true })

    if (error) throw error
    return (data ?? []) as CalendarItem[]
  },

  async create(workspaceId: string, dto: CreateCalendarItemDTO): Promise<CalendarItem> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...dto, workspace_id: workspaceId })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return data as CalendarItem
  },

  async update(workspaceId: string, id: string, dto: UpdateCalendarItemDTO): Promise<CalendarItem> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return data as CalendarItem
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw error
  },
}
