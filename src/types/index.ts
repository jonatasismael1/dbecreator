export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  settings: Record<string, unknown>
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

export type IdeaStatus = 'backlog' | 'doing' | 'done'

export interface Idea {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: IdeaStatus
  tags: string[]
  created_at: string
}
