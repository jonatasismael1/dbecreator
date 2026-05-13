import { supabase } from '@/lib/supabase/client'
import type { WorkspaceIntegration, CreateIntegrationDTO, UpdateIntegrationDTO, Platform } from '../types/integration.types'

const TABLE = 'workspace_integrations'
const PUBLIC_COLUMNS = 'id,workspace_id,platform,account_id,account_name,status,metadata,created_at,updated_at'

export const integrationsService = {
  async getByWorkspace(workspaceId: string): Promise<WorkspaceIntegration[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(PUBLIC_COLUMNS)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getByPlatform(workspaceId: string, platform: Platform): Promise<WorkspaceIntegration | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(PUBLIC_COLUMNS)
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async upsert(dto: CreateIntegrationDTO): Promise<WorkspaceIntegration> {
    if (dto.platform === 'instagram' && dto.access_token) {
      const { data, error } = await supabase.functions.invoke('connect-instagram', {
        body: { workspace_id: dto.workspace_id, access_token: dto.access_token },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.integration
    }

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dto, { onConflict: 'workspace_id,platform' })
      .select(PUBLIC_COLUMNS)
      .single()

    if (error) throw error
    return data
  },

  getInstagramOAuthUrl(workspaceId: string): string {
    const appId = import.meta.env.VITE_META_APP_ID
    if (!appId) throw new Error('VITE_META_APP_ID nao configurado.')

    const redirectUri = `${window.location.origin}/integrations/instagram/callback`
    const state = crypto.randomUUID()
    sessionStorage.setItem('instagram_oauth_state', state)
    sessionStorage.setItem('instagram_oauth_workspace_id', workspaceId)
    sessionStorage.setItem('instagram_oauth_redirect_uri', redirectUri)

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: [
        'pages_show_list',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_manage_insights',
        'business_management',
      ].join(','),
    })

    return `https://www.facebook.com/dialog/oauth?${params.toString()}`
  },

  async completeInstagramOAuth(params: {
    workspaceId: string
    code: string
    redirectUri: string
  }): Promise<WorkspaceIntegration> {
    const { data, error } = await supabase.functions.invoke('connect-instagram', {
      body: {
        workspace_id: params.workspaceId,
        code: params.code,
        redirect_uri: params.redirectUri,
      },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data.integration
  },

  async disconnect(workspaceId: string, platform: Platform): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)

    if (error) throw error
  }
}
