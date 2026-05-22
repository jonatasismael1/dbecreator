import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ideasService } from '../services/ideas.service'
import type { CreateIdeaDTO, UpdateIdeaDTO } from '../types/idea.types'

const QUERY_KEY = 'ideas'

export function useIdeas(workspaceId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, workspaceId],
    queryFn: () => ideasService.getAll(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCreateIdea(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: CreateIdeaDTO }) =>
      ideasService.create(workspaceId, userId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] }),
  })
}

export function useUpdateIdea(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateIdeaDTO }) =>
      ideasService.update(workspaceId, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] }),
  })
}

export function useDeleteIdea(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ideasService.delete(workspaceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] }),
  })
}
