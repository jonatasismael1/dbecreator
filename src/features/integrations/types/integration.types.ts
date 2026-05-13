export type Platform = 'instagram' | 'youtube'

export interface WorkspaceIntegration {
  id: string
  workspace_id: string
  platform: Platform
  access_token?: string | null
  account_id: string | null
  account_name: string | null
  status: 'connected' | 'disconnected' | 'error'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type CreateIntegrationDTO = Omit<WorkspaceIntegration, 'id' | 'created_at' | 'updated_at'>
export type UpdateIntegrationDTO = Partial<Omit<WorkspaceIntegration, 'id' | 'workspace_id' | 'platform' | 'created_at' | 'updated_at'>>
