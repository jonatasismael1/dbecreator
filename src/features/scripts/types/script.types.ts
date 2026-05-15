export type ScriptStatus = 'draft' | 'ready' | 'in_approval' | 'approved' | 'changes_requested' | 'recorded'

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
  campaign_id: string | null
  title: string
  hook: string
  body: string
  cta: string
  status: ScriptStatus
  last_analysis_score: number | null
  reference_link: string | null
  observations: string | null
  recording_date: string | null
  posting_date: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  content_pillars?: ScriptPillar | null
  campaigns?: {
    id: string
    title: string
    status: string
  } | null
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
  campaign_id: string | null
  reference_link: string | null
  observations: string | null
  recording_date: string | null
  posting_date: string | null
  created_by: string | null
  created_at: string
}

export type CreateScriptDTO = Pick<
  Script,
  'title' | 'hook' | 'body' | 'cta' | 'status' | 'content_pillar_id' | 'campaign_id' | 'reference_link' | 'observations' | 'recording_date' | 'posting_date'
>

export type UpdateScriptDTO = Partial<CreateScriptDTO>

export interface ScriptTemplate {
  id: string
  title: string
  category: string
  hook_template: string
  body_template: string
  cta_template: string
  created_at: string
}
