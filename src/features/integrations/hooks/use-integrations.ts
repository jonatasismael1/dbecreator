import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { integrationsService } from '../services/integrations.service'
import type { Platform, CreateIntegrationDTO } from '../types/integration.types'

export const integrationsKeys = {
  all: (workspaceId: string) => ['integrations', workspaceId] as const,
}

export function useIntegrations(workspaceId: string | undefined) {
  return useQuery({
    queryKey: integrationsKeys.all(workspaceId!),
    queryFn: () => integrationsService.getByWorkspace(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useUpsertIntegration(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIntegrationDTO) => integrationsService.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.all(workspaceId!) })
    },
  })
}

export function useDisconnectIntegration(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (platform: Platform) => integrationsService.disconnect(workspaceId!, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.all(workspaceId!) })
    },
  })
}
