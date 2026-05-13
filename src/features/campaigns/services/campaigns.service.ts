import { supabase } from '@/lib/supabase/client'
import type { Campaign, CreateCampaignDTO, UpdateCampaignDTO } from '../types/campaign.types'

const TABLE = 'campaigns'

interface CampaignScriptRow {
  script: Campaign['scripts'] extends Array<infer T> ? T : never
}

type CampaignRow = Omit<Campaign, 'scripts'> & {
  scripts?: CampaignScriptRow[]
}

export const campaignsService = {
  async getByWorkspace(workspaceId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        scripts:campaign_scripts(
          script:scripts(*)
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform nested scripts
    return (data as CampaignRow[] | null)?.map(campaign => ({
      ...campaign,
      scripts: campaign.scripts?.map((campaignScript) => campaignScript.script) || []
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

  async update(id: string, dto: UpdateCampaignDTO): Promise<Campaign> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },

  async addScriptToCampaign(campaignId: string, scriptId: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_scripts')
      .insert({ campaign_id: campaignId, script_id: scriptId })
    
    if (error) throw error
  },

  async removeScriptFromCampaign(campaignId: string, scriptId: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_scripts')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('script_id', scriptId)
    
    if (error) throw error
  }
}
