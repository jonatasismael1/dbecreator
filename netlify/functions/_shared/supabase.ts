import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { getEnv } from './env'
import { ApiError } from './responses'

export interface AuthContext {
  user: User
  admin: SupabaseClient
}

export function getAdminClient(): SupabaseClient {
  return createClient(
    getEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'not_authenticated', 'Usuario nao autenticado.')
  }

  const userClient = createClient(
    getEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']),
    getEnv('SUPABASE_ANON_KEY', ['VITE_SUPABASE_ANON_KEY']),
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )

  const { data, error } = await userClient.auth.getUser()
  if (error || !data.user) {
    throw new ApiError(401, 'invalid_session', 'Sessao invalida ou expirada.')
  }

  return {
    user: data.user,
    admin: getAdminClient(),
  }
}

export async function requireWorkspaceMember(
  admin: SupabaseClient,
  workspaceId: string,
  userId: string,
  options: { adminOnly?: boolean } = {},
) {
  const { data, error } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new ApiError(500, 'workspace_lookup_failed', 'Erro ao validar workspace.')
  if (!data) throw new ApiError(403, 'workspace_forbidden', 'Usuario nao pertence a este workspace.')

  if (options.adminOnly && !['owner', 'admin'].includes(data.role)) {
    throw new ApiError(403, 'workspace_admin_required', 'Apenas administradores podem alterar integracoes.')
  }

  return data
}

export function getWorkspaceId(url: URL, body?: Record<string, unknown>): string {
  const fromBody = typeof body?.workspace_id === 'string' ? body.workspace_id : null
  const workspaceId = fromBody || url.searchParams.get('workspace_id')

  if (!workspaceId) {
    throw new ApiError(400, 'missing_workspace_id', 'workspace_id e obrigatorio.')
  }

  return workspaceId
}
