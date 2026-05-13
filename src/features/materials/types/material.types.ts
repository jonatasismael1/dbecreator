export type MaterialType = 'link' | 'file' | 'audio' | 'video' | 'image' | 'note'

export interface Material {
  id: string
  workspace_id: string
  title: string
  type: MaterialType
  url: string | null
  content: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CreateMaterialDTO = Pick<
  Material,
  'title' | 'type' | 'url' | 'content' | 'tags'
>

export type UpdateMaterialDTO = Partial<CreateMaterialDTO>
