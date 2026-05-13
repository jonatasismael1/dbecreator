import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalsService } from '../services/approvals.service'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { CreateApprovalDTO } from '../types/approval.types'

// Hooks for Dashboard (Authenticated)
export function useApprovals() {
  const { workspaceId } = useWorkspaceContext()
  const queryClient = useQueryClient()
  const queryKey = ['approvals', workspaceId]

  const approvalsQuery = useQuery({
    queryKey,
    queryFn: () => approvalsService.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  })

  const createApproval = useMutation({
    mutationFn: (dto: CreateApprovalDTO) => approvalsService.create(workspaceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteApproval = useMutation({
    mutationFn: approvalsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    approvals: approvalsQuery.data ?? [],
    isLoading: approvalsQuery.isLoading,
    isError: approvalsQuery.isError,
    createApproval,
    deleteApproval,
  }
}

// Hooks for Public Page (Anonymous)
export function usePublicApproval(token: string) {
  const queryClient = useQueryClient()
  
  const approvalQuery = useQuery({
    queryKey: ['approval', token],
    queryFn: () => approvalsService.getByToken(token),
    enabled: !!token,
    retry: false,
  })

  const commentsQuery = useQuery({
    queryKey: ['approval_comments', approvalQuery.data?.id],
    queryFn: () => approvalsService.getComments(approvalQuery.data!.id),
    enabled: !!approvalQuery.data?.id,
  })

  const updateStatus = useMutation({
    mutationFn: (status: 'approved' | 'requested_changes') => approvalsService.updateStatusByToken(token, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval', token] })
    },
  })

  const addComment = useMutation({
    mutationFn: ({ content, authorName }: { content: string; authorName: string }) => 
      approvalsService.addComment(approvalQuery.data!.id, authorName, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval_comments', approvalQuery.data?.id] })
    },
  })

  return {
    approval: approvalQuery.data,
    comments: commentsQuery.data ?? [],
    isLoading: approvalQuery.isLoading,
    isError: approvalQuery.isError,
    updateStatus,
    addComment,
  }
}
