import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera as Instagram, Check, AlertCircle, Trash2 } from 'lucide-react'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { useIntegrations, useUpsertIntegration, useDisconnectIntegration } from '@/features/integrations/hooks/use-integrations'
import { LoadingState } from '@/components/shared/loading-state'

export function IntegrationsTab() {
  const { workspaceId } = useWorkspaceContext()
  const { data: integrations, isLoading } = useIntegrations(workspaceId)
  const upsert = useUpsertIntegration(workspaceId)
  const disconnect = useDisconnectIntegration(workspaceId)

  const [isConnecting, setIsConnecting] = useState(false)
  
  const instagramIntegration = integrations?.find(i => i.platform === 'instagram')
  const isConnected = !!instagramIntegration && instagramIntegration.status === 'connected'

  const handleConnectInstagram = async () => {
    setIsConnecting(true)
    try {
      const { integrationsService } = await import('@/features/integrations/services/integrations.service')
      window.location.href = integrationsService.getInstagramOAuthUrl(workspaceId!)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao iniciar conexao com Instagram.')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (confirm('Tem certeza que deseja desconectar o Instagram? Isso afetará a sincronização dos relatórios.')) {
      try {
        await disconnect.mutateAsync('instagram')
      } catch (err) {
        console.error(err)
        alert('Erro ao desconectar. Você precisa ser Administrador para remover integrações.')
      }
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/5 rounded-lg">
          <Instagram className="h-5 w-5 text-dbe-text" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-dbe-text">Conexões de Plataformas</h3>
          <p className="text-sm text-dbe-muted">Conecte suas contas para habilitar relatórios automáticos.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Instagram Integration Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-dbe-dark border border-dbe-border gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-dbe-text">Instagram</h4>
              <p className="text-xs text-dbe-muted flex items-center gap-1 mt-0.5">
                {isConnected ? (
                  <>
                    <Check className="h-3 w-3 text-dbe-green" />
                    <span className="text-dbe-green">Conectado como {instagramIntegration?.account_name || 'Usuário'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Não conectado
                  </>
                )}
              </p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <Button variant="ghost" className="text-dbe-red hover:text-red-400 hover:bg-red-500/10" onClick={handleDisconnect} disabled={disconnect.isPending}>
                <Trash2 className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={handleConnectInstagram} loading={isConnecting || upsert.isPending}>
                Conectar Conta
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
