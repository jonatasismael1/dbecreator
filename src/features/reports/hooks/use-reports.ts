import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '../services/reports.service'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { CreateMetricDTO, UpdateMetricDTO } from '../types/report.types'

export function useReports() {
  const { workspaceId } = useWorkspaceContext()
  const queryClient = useQueryClient()
  const queryKey = ['performance_metrics', workspaceId]

  const metricsQuery = useQuery({
    queryKey,
    queryFn: () => reportsService.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  })

  const createMetric = useMutation({
    mutationFn: (dto: CreateMetricDTO) => reportsService.create(workspaceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateMetric = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMetricDTO }) =>
      reportsService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMetric = useMutation({
    mutationFn: reportsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    metrics: metricsQuery.data ?? [],
    isLoading: metricsQuery.isLoading,
    isError: metricsQuery.isError,
    refetch: metricsQuery.refetch,
    createMetric,
    updateMetric,
    deleteMetric,
  }
}
