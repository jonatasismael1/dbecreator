import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { ApprovalBatch } from '../types/approval.types'

export function useBatchApprovals() {
  const { workspaceId } = useWorkspaceContext()
  const queryClient = useQueryClient()
  const queryKey = ['approval-batches', workspaceId]

  const batchesQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<ApprovalBatch[]> => {
      const { data, error } = await supabase
        .from('approval_batches')
        .select(`
          *,
          campaign:campaigns(id, title),
          items:approval_batch_items(
            id, batch_id, script_id, status, client_feedback, reviewed_at, created_at,
            script:scripts(id, title, hook, body, cta, status)
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ApprovalBatch[]
    },
    enabled: !!workspaceId,
  })

  const createBatch = useMutation({
    mutationFn: async ({
      campaignId,
      scriptIds,
      clientName,
      expiresAt,
    }: {
      campaignId?: string | null
      scriptIds: string[]
      clientName?: string | null
      expiresAt?: string | null
    }) => {
      if (scriptIds.length === 0) throw new Error('Selecione ao menos um roteiro.')
      const { data: user } = await supabase.auth.getUser()

      const { data: validScripts, error: scriptsLookupError } = await supabase
        .from('scripts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .in('id', scriptIds)

      if (scriptsLookupError) throw scriptsLookupError
      if ((validScripts ?? []).length !== scriptIds.length) {
        throw new Error('Um ou mais roteiros nao pertencem ao workspace atual.')
      }

      if (campaignId) {
        const { data: campaign, error: campaignLookupError } = await supabase
          .from('campaigns')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('id', campaignId)
          .maybeSingle()

        if (campaignLookupError) throw campaignLookupError
        if (!campaign) throw new Error('Campanha nao encontrada no workspace atual.')
      }

      const { data: batch, error: batchError } = await supabase
        .from('approval_batches')
        .insert({
          workspace_id: workspaceId,
          campaign_id: campaignId || null,
          client_name: clientName || null,
          expires_at: expiresAt || null,
          created_by: user.user?.id,
          status: 'pending',
        })
        .select()
        .single()

      if (batchError) throw batchError

      const items = scriptIds.map((scriptId) => ({
        batch_id: batch.id,
        script_id: scriptId,
        status: 'pending',
      }))

      const { error: itemsError } = await supabase
        .from('approval_batch_items')
        .insert(items)

      if (itemsError) {
        await supabase
          .from('approval_batches')
          .delete()
          .eq('id', batch.id)
          .eq('workspace_id', workspaceId)
        throw itemsError
      }

      const { error: updateScriptsError } = await supabase
        .from('scripts')
        .update({ status: 'in_approval', updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .in('id', scriptIds)

      if (updateScriptsError) throw updateScriptsError

      if (campaignId) {
        const { error: updateCampaignError } = await supabase
          .from('campaigns')
          .update({ status: 'in_approval', updated_at: new Date().toISOString() })
          .eq('workspace_id', workspaceId)
          .eq('id', campaignId)

        if (updateCampaignError) throw updateCampaignError
      }

      return batch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['scripts', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['approvals', workspaceId] })
    },
  })

  const deleteBatch = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('approval_batches')
        .delete()
        .eq('id', batchId)
        .eq('workspace_id', workspaceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    batches: batchesQuery.data ?? [],
    isLoading: batchesQuery.isLoading,
    createBatch,
    deleteBatch,
  }
}
