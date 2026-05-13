import type { Script } from '@/features/scripts/types/script.types'

export type CampaignStatus = 'planning' | 'active' | 'completed' | 'paused'

export interface ChecklistItem {
  id: string
  task: string
  completed: boolean
}

export interface Campaign {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: CampaignStatus
  start_date: string | null
  end_date: string | null
  goal: string | null
  checklist: ChecklistItem[]
  created_by: string | null
  created_at: string
  updated_at: string
  scripts?: Script[]
}

export type CreateCampaignDTO = Pick<
  Campaign,
  'title' | 'description' | 'status' | 'start_date' | 'end_date' | 'goal' | 'checklist'
>

export type UpdateCampaignDTO = Partial<CreateCampaignDTO>
