import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materialsService } from '../services/materials.service'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { CreateMaterialDTO, UpdateMaterialDTO } from '../types/material.types'

export function useMaterials() {
  const { workspaceId } = useWorkspaceContext()
  const queryClient = useQueryClient()
  const queryKey = ['materials', workspaceId]

  const materialsQuery = useQuery({
    queryKey,
    queryFn: () => materialsService.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  })

  const createMaterial = useMutation({
    mutationFn: (dto: CreateMaterialDTO) => materialsService.create(workspaceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateMaterial = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMaterialDTO }) =>
      materialsService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMaterial = useMutation({
    mutationFn: materialsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    materials: materialsQuery.data ?? [],
    isLoading: materialsQuery.isLoading,
    isError: materialsQuery.isError,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  }
}
