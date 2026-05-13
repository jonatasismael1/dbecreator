import type { Script } from '@/features/scripts/types/script.types'

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'other'

export interface PerformanceMetric {
  id: string
  workspace_id: string
  script_id: string | null
  platform: Platform
  published_at: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  watch_time_seconds: number
  retention_rate: number
  link_clicks: number
  external_media_id: string | null
  external_permalink: string | null
  caption: string | null
  thumbnail_url: string | null
  media_type: string | null
  account_id: string | null
  raw_insights: Record<string, unknown>
  synced_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  script?: Script
}

export type CreateMetricDTO = Pick<
  PerformanceMetric,
  | 'script_id'
  | 'platform'
  | 'published_at'
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves'
  | 'watch_time_seconds'
  | 'retention_rate'
  | 'link_clicks'
>

export type UpdateMetricDTO = Partial<CreateMetricDTO>
