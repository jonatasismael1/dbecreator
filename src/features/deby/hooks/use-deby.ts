import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { debyService } from '../services/deby.service'

const KEY = (workspaceId: string) => ['ai_analyses', workspaceId]

export function useDebyHistory(workspaceId: string) {
  return useQuery({
    queryKey: KEY(workspaceId),
    queryFn: () => debyService.getHistory(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useAnalyzeScript(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (scriptId: string) => debyService.analyzeScript(scriptId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(workspaceId) })
      qc.invalidateQueries({ queryKey: ['scripts', workspaceId] })
    },
  })
}
