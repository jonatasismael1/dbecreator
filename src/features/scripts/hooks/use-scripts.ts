import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scriptsService } from '../services/scripts.service'
import type { CreateScriptDTO, UpdateScriptDTO } from '../types/script.types'

const KEY = (workspaceId: string) => ['scripts', workspaceId]

export function useScripts(workspaceId: string) {
  return useQuery({
    queryKey: KEY(workspaceId),
    queryFn: () => scriptsService.getAll(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCreateScript(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateScriptDTO) => scriptsService.create(workspaceId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(workspaceId) })
      qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
    },
  })
}

export function useUpdateScript(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateScriptDTO }) =>
      scriptsService.update(workspaceId, id, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEY(workspaceId) })
      qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
      qc.invalidateQueries({ queryKey: ['script_versions', workspaceId, variables.id] })
    },
  })
}

export function useDeleteScript(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scriptsService.delete(workspaceId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(workspaceId) })
      qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
    },
  })
}

export function useArchiveScript(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scriptsService.archive(workspaceId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(workspaceId) })
      qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
    },
  })
}

export function useRestoreScript(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scriptsService.restore(workspaceId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(workspaceId) })
      qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
    },
  })
}

export function useScriptVersions(workspaceId: string, scriptId?: string | null) {
  return useQuery({
    queryKey: ['script_versions', workspaceId, scriptId],
    queryFn: () => scriptsService.getVersions(workspaceId, scriptId!),
    enabled: !!workspaceId && !!scriptId,
  })
}
