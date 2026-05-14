import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsService } from '../services/campaigns.service'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { CreateCampaignDTO, UpdateCampaignDTO } from '../types/campaign.types'

export function useCampaigns() {
  const { workspaceId } = useWorkspaceContext()
  const queryClient = useQueryClient()
  const queryKey = ['campaigns', workspaceId]

  const campaignsQuery = useQuery({
    queryKey,
    queryFn: () => campaignsService.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  })

  const createCampaign = useMutation({
    mutationFn: (dto: CreateCampaignDTO) => campaignsService.create(workspaceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateCampaign = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignDTO }) =>
      campaignsService.update(workspaceId, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => campaignsService.delete(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    isError: campaignsQuery.isError,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  }
}
