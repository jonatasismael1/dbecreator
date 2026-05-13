export type CalendarPlatform = 'reels' | 'tiktok' | 'shorts'

export interface CalendarScript {
  id: string
  title: string
  status: string
  last_analysis_score: number | null
}

export interface CalendarItem {
  id: string
  workspace_id: string
  script_id: string | null
  publish_date: string
  platform: CalendarPlatform
  notes: string | null
  created_at: string
  updated_at: string
  scripts?: CalendarScript | null
}

export interface CreateCalendarItemDTO {
  script_id: string
  publish_date: string
  platform: CalendarPlatform
  notes?: string | null
}

export type UpdateCalendarItemDTO = Partial<Omit<CreateCalendarItemDTO, 'script_id'>>
