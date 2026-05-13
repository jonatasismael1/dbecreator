import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketMapService } from '../services/market-map.service'
import type { UpsertMarketMapDTO } from '../types/market-map.types'

const KEY = (wid: string) => ['market-map', wid]

export function useMarketMap(workspaceId: string) {
  return useQuery({
    queryKey: KEY(workspaceId),
    queryFn: () => marketMapService.get(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useUpsertMarketMap(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpsertMarketMapDTO) => marketMapService.upsert(workspaceId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}

export function useAnalyzeMarketMap(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => marketMapService.analyze(workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}
