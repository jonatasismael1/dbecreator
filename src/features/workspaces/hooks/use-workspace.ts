import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/context/auth-context'

interface Workspace {
  id: string
  name: string
  slug: string
}

async function getOrCreateWorkspace(userId: string, userEmail: string): Promise<Workspace> {
  const { data: member, error: memberErr } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, name, slug)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (memberErr) {
    console.error('[useWorkspace] Error fetching membership:', memberErr)
    throw memberErr
  }

  if (member?.workspaces) {
    return member.workspaces as unknown as Workspace
  }

  const workspaceId = crypto.randomUUID()
  const base = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
  const slug = `${base}-${Date.now()}`
  const name = `Workspace de ${userEmail.split('@')[0]}`

  const { error: wsError } = await supabase
    .from('workspaces')
    .insert({ id: workspaceId, name, slug, created_by: userId })

  if (wsError) {
    console.error('[useWorkspace] Error creating workspace:', wsError)
    throw wsError
  }

  const { error: memberInsertError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role: 'owner' })

  if (memberInsertError) {
    console.error('[useWorkspace] Error inserting membership:', memberInsertError)
    throw memberInsertError
  }

  return { id: workspaceId, name, slug }
}

export function useWorkspace() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workspace', user?.id],
    queryFn: () => getOrCreateWorkspace(user!.id, user!.email!),
    enabled: !!user?.id && !!user?.email,
    staleTime: Infinity,
    retry: 2,
  })
}
