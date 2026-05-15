import type { Script } from '@/features/scripts/types/script.types'

export type ApprovalStatus = 'pending' | 'approved' | 'requested_changes'

export type ApprovalCommentSection = 'GANCHO' | 'DESENVOLVIMENTO' | 'CTA' | 'GERAL'

export interface ApprovalComment {
  id: string
  approval_id: string
  content: string
  author_name: string
  section: ApprovalCommentSection
  resolved: boolean
  created_at: string
}

export type BatchStatus = 'pending' | 'approved' | 'partially_approved' | 'requested_changes'

export interface ApprovalBatchItem {
  id: string
  batch_id: string
  script_id: string
  status: ApprovalStatus
  client_feedback: string | null
  reviewed_at: string | null
  created_at: string
  script?: Script | null
}

export interface ApprovalBatch {
  id: string
  workspace_id: string
  campaign_id: string | null
  token: string
  status: BatchStatus
  client_name: string | null
  client_email: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  campaign?: { id: string; title: string } | null
  items?: ApprovalBatchItem[]
}

export type CreateApprovalBatchDTO = {
  campaign_id?: string | null
  script_ids: string[]
  client_name?: string | null
  client_email?: string | null
  expires_at?: string | null
}

export interface Approval {
  id: string
  workspace_id: string
  script_id: string
  token: string
  status: ApprovalStatus
  client_name: string | null
  client_email: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  script?: (Script & {
    campaign?: {
      id: string
      title: string
    } | null
  }) | null
  workspace?: {
    name: string
    logo_url: string | null
  } | null
  comments?: ApprovalComment[]
}

export type CreateApprovalDTO = Pick<
  Approval,
  'script_id' | 'client_name' | 'client_email' | 'expires_at'
>
