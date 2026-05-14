export interface DebyResult {
  score: number
  classification: string
  diagnosis: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  improved_hook: string
  improved_cta: string
  rewritten_script: string
  pillar_suggestion: string
  conversion_risk: string
  alignment_warning: string | null
}

export interface AiAnalysis {
  id: string
  workspace_id: string
  script_id: string
  model: string
  result: DebyResult
  created_at: string
  scripts?: {
    id: string
    title: string
  } | null
}

export type DebyAnalysisStatus = 'idle' | 'loading' | 'success' | 'error'
