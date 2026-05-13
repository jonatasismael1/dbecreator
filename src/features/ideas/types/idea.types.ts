export type IdeaStatus = 'backlog' | 'doing' | 'done'

export interface Idea {
  id: string
  workspace_id: string
  user_id: string
  title: string
  description: string | null
  status: IdeaStatus
  tags: string[]
  created_at: string
  updated_at: string
}

export type CreateIdeaDTO = Pick<Idea, 'title' | 'description' | 'status' | 'tags'>
export type UpdateIdeaDTO = Partial<CreateIdeaDTO>
