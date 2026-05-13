import { useMutation } from '@tanstack/react-query'
import { integrationsService } from '@/features/integrations/services/integrations.service'

export function useInstagramInsights(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')
      return integrationsService.getInstagramInsights(workspaceId)
    },
  })
}
