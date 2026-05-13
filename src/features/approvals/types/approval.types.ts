import type { Script } from '@/features/scripts/types/script.types'

export type ApprovalStatus = 'pending' | 'approved' | 'requested_changes'

export interface ApprovalComment {
  id: string
  approval_id: string
  content: string
  author_name: string
  created_at: string
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
  script?: Script
}

export type CreateApprovalDTO = Pick<
  Approval,
  'script_id' | 'client_name' | 'client_email' | 'expires_at'
>
