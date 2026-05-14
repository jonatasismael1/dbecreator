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
    biography?: string
    followers_count?: number
    follows_count?: number
    media_count?: number
    profile_picture_url?: string
  }
  metrics: {
    media_views: number | null
    media_viewers: number | null
    reach?: number | null
    profile_views: number | null
    follower_count: number | null
  }
  media: InstagramMediaInsight[]
  metric_errors: Record<string, string>
  synced_at: string
}

export interface InstagramMediaInsight {
  id: string
  caption?: string
  media_type?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  media_url?: string
  permalink?: string
  thumbnail_url?: string
  insights: {
    media_views: number | null
    media_viewers: number | null
    reach?: number | null
    likes: number | null
    comments: number | null
    saved: number | null
    shares?: number | null
    total_interactions?: number | null
  }
  insight_errors: Record<string, string>
}
