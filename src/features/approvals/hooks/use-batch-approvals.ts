import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'

export function useBatchApprovals() {
  const { workspaceId } = useWorkspaceContext()
  const queryClient = useQueryClient()

  const createBatch = useMutation({
    mutationFn: async ({ campaignId, scriptIds }: { campaignId?: string; scriptIds: string[] }) => {
      const { data: user } = await supabase.auth.getUser()

      // Create batch
      const { data: batch, error: batchError } = await supabase
        .from('approval_batches')
        .insert({
          workspace_id: workspaceId,
          campaign_id: campaignId || null,
          created_by: user.user?.id,
          status: 'pending',
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Create items
      const items = scriptIds.map((scriptId) => ({
        batch_id: batch.id,
        script_id: scriptId,
        status: 'pending',
      }))

      const { error: itemsError } = await supabase
        .from('approval_batch_items')
        .insert(items)

      if (itemsError) throw itemsError

      // Update scripts to 'in_approval'
      await supabase
        .from('scripts')
        .update({ status: 'in_approval' })
        .in('id', scriptIds)

      // Update campaign to 'in_approval' if applicable
      if (campaignId) {
        await supabase
          .from('campaigns')
          .update({ status: 'in_approval' })
          .eq('id', campaignId)
      }

      return batch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['approvals', workspaceId] })
    },
  })

  return { createBatch }
}
