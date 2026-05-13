import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface InstagramMedia {
  id: string
  metric_id: string
  script_id: string | null
  caption?: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
    watch_time_seconds: number
    retention_rate: number
  }
  raw_insights?: Record<string, unknown>
}

export function useSyncInstagram(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')
      
      const { data, error } = await supabase.functions.invoke('sync-instagram-metrics', {
        body: { workspace_id: workspaceId },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      return data.media as InstagramMedia[]
    },
  })
}
