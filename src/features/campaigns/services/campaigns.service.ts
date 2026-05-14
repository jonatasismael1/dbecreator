import { supabase } from '@/lib/supabase/client'
import type { Campaign, CreateCampaignDTO, UpdateCampaignDTO } from '../types/campaign.types'

const TABLE = 'campaigns'

interface CampaignScriptRow {
  script: Campaign['scripts'] extends Array<infer T> ? T : never
}

type CampaignRow = Omit<Campaign, 'scripts'> & {
  scripts?: Campaign['scripts'] | CampaignScriptRow[]
}

export const campaignsService = {
  async getByWorkspace(workspaceId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        scripts(*, content_pillars(id,title,color,type))
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform nested scripts
    return (data as CampaignRow[] | null)?.map(campaign => ({
      ...campaign,
      scripts: normalizeCampaignScripts(campaign.scripts)
    })) || []
  },

  async create(workspaceId: string, dto: CreateCampaignDTO): Promise<Campaign> {
    const { data: user } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        ...dto,
        workspace_id: workspaceId,
        created_by: user.user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(workspaceId: string, id: string, dto: UpdateCampaignDTO): Promise<Campaign> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (error) throw error
  },

  async addScriptToCampaign(campaignId: string, scriptId: string): Promise<void> {
    const { error } = await supabase
      .from('scripts')
      .update({ campaign_id: campaignId, updated_at: new Date().toISOString() })
      .eq('id', scriptId)
    
    if (error) throw error
  },

  async removeScriptFromCampaign(campaignId: string, scriptId: string): Promise<void> {
    const { error } = await supabase
      .from('scripts')
      .update({ campaign_id: null, updated_at: new Date().toISOString() })
      .eq('id', scriptId)
      .eq('campaign_id', campaignId)
    
    if (error) throw error
  }
}

function normalizeCampaignScripts(scripts: CampaignRow['scripts']) {
  if (!scripts) return []
  return scripts.map((item) => {
    if (item && typeof item === 'object' && 'script' in item) {
      return item.script
    }
    return item
  })
}
