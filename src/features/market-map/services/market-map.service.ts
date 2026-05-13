import { supabase } from '@/lib/supabase/client'
import type { MarketMap, MarketMapInsights, UpsertMarketMapDTO } from '../types/market-map.types'

const TABLE = 'market_maps'

export const marketMapService = {
  async get(workspaceId: string): Promise<MarketMap | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async upsert(workspaceId: string, dto: UpsertMarketMapDTO): Promise<MarketMap> {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(
        { ...dto, workspace_id: workspaceId, updated_at: new Date().toISOString() },
        { onConflict: 'workspace_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  async analyze(workspaceId: string): Promise<MarketMapInsights> {
    const { data, error } = await supabase.functions.invoke('analyze-market-map', {
      body: { workspace_id: workspaceId },
    })

    if (error) throw error
    if (!data?.insights) throw new Error('Resposta da Deby sem insights.')
    return data.insights as MarketMapInsights
  },
}
