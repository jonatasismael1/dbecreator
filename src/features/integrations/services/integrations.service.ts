import { supabase } from '@/lib/supabase/client'
import type {
  WorkspaceIntegration,
  CreateIntegrationDTO,
  Platform,
  InstagramInsightsResponse,
} from '../types/integration.types'

const TABLE = 'workspace_integrations'
const PUBLIC_COLUMNS = 'id,workspace_id,platform,account_id,account_name,status,metadata,facebook_page_id,facebook_page_name,instagram_business_account_id,token_expires_at,permissions,created_at,updated_at'

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
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dto, { onConflict: 'workspace_id,platform' })
      .select(PUBLIC_COLUMNS)
      .single()

    if (error) throw error
    return data
  },

  async startInstagramOAuth(workspaceId: string): Promise<void> {
    clearInstagramOAuthClientState()

    const data = await apiRequest<{ auth_url: string }>(`/api/meta/login?${new URLSearchParams({
      workspace_id: workspaceId,
      format: 'json',
    })}`)

    window.location.href = data.auth_url
  },

  async getInstagramInsights(workspaceId: string): Promise<InstagramInsightsResponse> {
    return apiRequest(`/api/meta/instagram-insights?${new URLSearchParams({ workspace_id: workspaceId })}`)
  },

  async disconnect(workspaceId: string, platform: Platform): Promise<void> {
    if (platform === 'instagram') {
      await apiRequest('/api/meta/disconnect', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      return
    }

    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)

    if (error) throw error
  }
}

function clearInstagramOAuthClientState() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      const normalized = key.toLowerCase()
      if (normalized.includes('instagram') || normalized.includes('meta_oauth') || normalized.includes('meta-error')) {
        storage.removeItem(key)
      }
    }
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Sessao expirada. Entre novamente para conectar o Instagram.')

  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data?.error === 'token_expired') {
      window.location.assign('/settings?meta_error=token_expired')
    }
    throw new Error(data?.message || data?.error || 'Erro na integracao Meta.')
  }

  return data as T
}
