export interface MarketMap {
  id: string
  workspace_id: string
  niche: string | null
  target_audience: string | null
  main_pain: string | null
  competitors: Competitor[]
  differentiators: string | null
  tone_of_voice: string | null
  is_complete: boolean
  deby_insights: MarketMapInsights | null
  last_insights_at: string | null
  created_at: string
  updated_at: string
}

export interface MarketMapInsights {
  positioning_summary: string
  audience_insights: string[]
  content_opportunities: string[]
  pillar_recommendations: string[]
  risks: string[]
  next_actions: string[]
}

export interface Competitor {
  name: string
  strength: string
}

export type UpsertMarketMapDTO = Omit<
  MarketMap,
  'id' | 'workspace_id' | 'deby_insights' | 'last_insights_at' | 'created_at' | 'updated_at'
>
