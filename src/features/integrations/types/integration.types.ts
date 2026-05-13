export type Platform = 'instagram' | 'youtube'

export interface WorkspaceIntegration {
  id: string
  workspace_id: string
  platform: Platform
  access_token?: string | null
  account_id: string | null
  account_name: string | null
  status: 'connected' | 'disconnected' | 'error'
  metadata: Record<string, unknown>
  facebook_page_id?: string | null
  facebook_page_name?: string | null
  instagram_business_account_id?: string | null
  token_expires_at?: string | null
  permissions?: string[]
  created_at: string
  updated_at: string
}

export type CreateIntegrationDTO = Omit<WorkspaceIntegration, 'id' | 'created_at' | 'updated_at'>
export type UpdateIntegrationDTO = Partial<Omit<WorkspaceIntegration, 'id' | 'workspace_id' | 'platform' | 'created_at' | 'updated_at'>>

export interface ConnectableInstagramAccount {
  id: string
  facebook_page_id: string
  facebook_page_name: string
  instagram_business_account_id: string
  instagram_username: string | null
  permissions: string[]
  expires_at: string
}

export interface InstagramAccountsResponse {
  connected: Pick<
    WorkspaceIntegration,
    | 'id'
    | 'status'
    | 'account_id'
    | 'account_name'
    | 'facebook_page_id'
    | 'facebook_page_name'
    | 'instagram_business_account_id'
    | 'token_expires_at'
    | 'permissions'
    | 'updated_at'
  > | null
  accounts: ConnectableInstagramAccount[]
}

export interface InstagramInsightsResponse {
  integration: {
    id: string
    account_name: string | null
    facebook_page_name: string | null
    instagram_business_account_id: string
    token_expires_at: string | null
  }
  account: {
    id: string
    username?: string
    name?: string
    followers_count?: number
    media_count?: number
  }
  metrics: {
    reach: number | null
    profile_views: number | null
    website_clicks: number | null
    follower_count: number | null
  }
  metric_errors: Record<string, string>
  synced_at: string
}
