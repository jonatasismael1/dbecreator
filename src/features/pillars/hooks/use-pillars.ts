import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pillarsService } from '../services/pillars.service'
import type { CreatePillarDTO, UpdatePillarDTO } from '../types/pillar.types'

const KEY = (wid: string) => ['pillars', wid]

export function usePillars(workspaceId: string) {
  return useQuery({
    queryKey: KEY(workspaceId),
    queryFn: () => pillarsService.getAll(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCreatePillar(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePillarDTO) => pillarsService.create(workspaceId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}

export function useUpdatePillar(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePillarDTO }) =>
      pillarsService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}

export function useDeletePillar(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pillarsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}
