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
      queryClient.invalidateQueries({ queryKey: ['scripts', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
    },
  })

  const deleteApproval = useMutation({
    mutationFn: (id: string) => approvalsService.delete(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['scripts', workspaceId] })
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

  const updateStatus = useMutation({
    mutationFn: (input: { action: 'approve' | 'request_changes'; authorName?: string; comment?: string }) =>
      approvalsService.updateStatusByToken(token, input.action, {
        authorName: input.authorName,
        comment: input.comment,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['approval', token], data)
    },
  })

  return {
    approval: approvalQuery.data,
    comments: approvalQuery.data?.comments ?? [],
    isLoading: approvalQuery.isLoading,
    isError: approvalQuery.isError,
    updateStatus,
  }
}
