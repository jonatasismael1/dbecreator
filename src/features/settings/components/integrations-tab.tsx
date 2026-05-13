import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Camera as Instagram, Check, RefreshCw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/loading-state'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { useDisconnectIntegration, useIntegrations, useUpsertIntegration } from '@/features/integrations/hooks/use-integrations'
import type { ConnectableInstagramAccount } from '@/features/integrations/types/integration.types'

export function IntegrationsTab() {
  const { workspaceId } = useWorkspaceContext()
  const { data: integrations, isLoading, refetch } = useIntegrations(workspaceId)
  const upsert = useUpsertIntegration(workspaceId)
  const disconnect = useDisconnectIntegration(workspaceId)
  const [searchParams, setSearchParams] = useSearchParams()

  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [pendingAccounts, setPendingAccounts] = useState<ConnectableInstagramAccount[]>([])
  const [error, setError] = useState<string | null>(
    searchParams.get('meta_message') || mapMetaError(searchParams.get('meta_error')),
  )

  const instagramIntegration = integrations?.find((integration) => integration.platform === 'instagram')
  const isConnected = !!instagramIntegration && instagramIntegration.status === 'connected'

  async function loadInstagramAccounts() {
    setIsLoadingAccounts(true)
    setError(null)
    try {
      const { integrationsService } = await import('@/features/integrations/services/integrations.service')
      const data = await integrationsService.getInstagramAccounts(workspaceId)
      setPendingAccounts(data.accounts)
      if (data.accounts.length === 0 && !data.connected) {
        setError('Nenhuma conta Instagram profissional pendente foi encontrada. Tente conectar novamente.')
      }
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas Instagram.')
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  useEffect(() => {
    if (!workspaceId) return
    if (searchParams.get('instagram') === 'select') {
      queueMicrotask(() => {
        void loadInstagramAccounts()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const handleConnectInstagram = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const { integrationsService } = await import('@/features/integrations/services/integrations.service')
      await integrationsService.startInstagramOAuth(workspaceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar conexao com Instagram.')
      setIsConnecting(false)
    }
  }

  const handleSelectAccount = async (accountId: string) => {
    setSelectedAccountId(accountId)
    setError(null)
    try {
      const { integrationsService } = await import('@/features/integrations/services/integrations.service')
      await integrationsService.selectInstagramAccount(workspaceId, accountId)
      setPendingAccounts([])
      setSearchParams({}, { replace: true })
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conta Instagram.')
    } finally {
      setSelectedAccountId(null)
    }
  }

  const handleDisconnect = async () => {
    if (confirm('Tem certeza que deseja desconectar o Instagram? Isso afetara a sincronizacao dos relatorios.')) {
      try {
        await disconnect.mutateAsync('instagram')
        setPendingAccounts([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao desconectar. Voce precisa ser Administrador para remover integracoes.')
      }
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-white/5 p-2">
          <Instagram className="h-5 w-5 text-dbe-text" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-dbe-text">Conexoes de Plataformas</h3>
          <p className="text-sm text-dbe-muted">Conecte suas contas para habilitar relatorios automaticos.</p>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-dbe-red/30 bg-dbe-red/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-dbe-border bg-dbe-dark p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-dbe-text">Instagram</h4>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-dbe-muted">
                {isConnected ? (
                  <>
                    <Check className="h-3 w-3 text-dbe-green" />
                    <span className="text-dbe-green">Conectado como {instagramIntegration?.account_name || 'Usuario'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Nao conectado
                  </>
                )}
              </p>
              {isConnected && instagramIntegration?.facebook_page_name && (
                <p className="mt-1 text-xs text-dbe-muted">Pagina: {instagramIntegration.facebook_page_name}</p>
              )}
            </div>
          </div>

          <div>
            {isConnected ? (
              <Button variant="ghost" className="text-dbe-red hover:bg-red-500/10 hover:text-red-400" onClick={handleDisconnect} disabled={disconnect.isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={handleConnectInstagram} loading={isConnecting || upsert.isPending}>
                Conectar Instagram Profissional
              </Button>
            )}
          </div>
        </div>

        {(pendingAccounts.length > 0 || isLoadingAccounts) && (
          <div className="rounded-lg border border-dbe-border bg-dbe-dark p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-medium text-dbe-text">Escolha a conta profissional</h4>
                <p className="text-xs text-dbe-muted">As contas abaixo vieram da Meta e ficam disponiveis por poucos minutos.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadInstagramAccounts} disabled={isLoadingAccounts}>
                <RefreshCw className={`h-4 w-4 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-2">
              {pendingAccounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-3 rounded-md border border-dbe-border/70 bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-dbe-text">
                      {account.instagram_username ? `@${account.instagram_username}` : account.instagram_business_account_id}
                    </p>
                    <p className="text-xs text-dbe-muted">Pagina: {account.facebook_page_name}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectAccount(account.id)}
                    loading={selectedAccountId === account.id}
                    className="w-full sm:w-auto"
                  >
                    Usar esta conta
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function mapMetaError(code: string | null): string | null {
  if (!code) return null

  const messages: Record<string, string> = {
    user_denied_permissions: 'Permissoes negadas na Meta. Autorize as permissoes para conectar o Instagram.',
    no_facebook_pages: 'Nenhuma Pagina do Facebook administrada por voce foi encontrada.',
    no_instagram_business_account: 'Nenhuma Pagina com Instagram Business ou Creator conectado foi encontrada.',
    instagram_not_business_or_creator: 'A conta Instagram precisa ser Business ou Creator.',
    token_expired: 'Token expirado. Reconecte o Instagram.',
    meta_app_review_required: 'O app da Meta ainda nao tem App Review aprovado para esta permissao.',
    meta_graph_error: 'A Graph API retornou erro ao conectar o Instagram.',
  }

  return messages[code] || 'Nao foi possivel concluir a autenticacao Meta.'
}
