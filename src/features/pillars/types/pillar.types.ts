export type PillarType = 'authority' | 'sales' | 'connection' | 'education' | 'entertainment' | 'custom'

export interface ContentPillar {
  id: string
  workspace_id: string
  title: string
  description: string | null
  type: PillarType
  color: string
  icon: string
  is_active: boolean
  position: number
  created_at: string
}

export type CreatePillarDTO = Omit<ContentPillar, 'id' | 'workspace_id' | 'created_at'>
export type UpdatePillarDTO = Partial<CreatePillarDTO>
