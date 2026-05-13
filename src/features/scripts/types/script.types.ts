export type ScriptStatus = 'draft' | 'ready' | 'recorded'

export interface ScriptPillar {
  id: string
  title: string
  color: string
  type: string
}

export interface Script {
  id: string
  workspace_id: string
  idea_id: string | null
  content_pillar_id: string | null
  title: string
  hook: string
  body: string
  cta: string
  status: ScriptStatus
  last_analysis_score: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
  content_pillars?: ScriptPillar | null
}

export interface ScriptVersion {
  id: string
  workspace_id: string
  script_id: string
  version_number: number
  title: string
  hook: string
  body: string
  cta: string
  status: ScriptStatus
  content_pillar_id: string | null
  created_by: string | null
  created_at: string
}

export type CreateScriptDTO = Pick<
  Script,
  'title' | 'hook' | 'body' | 'cta' | 'status' | 'content_pillar_id'
>

export type UpdateScriptDTO = Partial<CreateScriptDTO>
