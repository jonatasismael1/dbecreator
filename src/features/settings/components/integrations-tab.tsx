import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Camera as Instagram, Check, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/loading-state'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { useDisconnectIntegration, useIntegrations } from '@/features/integrations/hooks/use-integrations'

export function IntegrationsTab() {
  const { workspaceId } = useWorkspaceContext()
  const { data: integrations, isLoading, refetch } = useIntegrations(workspaceId)
  const disconnect = useDisconnectIntegration(workspaceId)
  const [searchParams, setSearchParams] = useSearchParams()

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(() => getMetaErrorMessage(searchParams))

  const instagramIntegration = integrations?.find((integration) => integration.platform === 'instagram')
  const isConnected = !!instagramIntegration && instagramIntegration.status === 'connected'

  useEffect(() => {
    if (!workspaceId) return
    if (searchParams.get('connected') === 'instagram') {
      void refetch()
      setSearchParams({}, { replace: true })
    }
  }, [refetch, searchParams, setSearchParams, workspaceId])

  useEffect(() => {
    const metaError = getMetaErrorMessage(searchParams)
    if (metaError) setError(metaError)
  }, [searchParams])

  const handleConnectInstagram = async () => {
    setIsConnecting(true)
    setError(null)
    setSearchParams({}, { replace: true })
    try {
      const { integrationsService } = await import('@/features/integrations/services/integrations.service')
      await integrationsService.startInstagramOAuth(workspaceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar conexao com Instagram.')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (confirm('Tem certeza que deseja desconectar o Instagram? Isso afetara a sincronizacao dos relatorios.')) {
      try {
        await disconnect.mutateAsync('instagram')
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
          <div className="whitespace-pre-wrap rounded-lg border border-dbe-red/30 bg-dbe-red/10 p-3 text-sm text-red-200">
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
                    <span className="text-dbe-green">Instagram conectado{instagramIntegration?.account_name ? ` como @${instagramIntegration.account_name}` : ''}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Nao conectado
                  </>
                )}
              </p>
              {isConnected && instagramIntegration?.token_expires_at && (
                <p className="mt-1 text-xs text-dbe-muted">
                  Token valido ate {new Date(instagramIntegration.token_expires_at).toLocaleDateString('pt-BR')}
                </p>
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
              <Button onClick={handleConnectInstagram} loading={isConnecting}>
                Conectar Instagram
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function getMetaErrorMessage(searchParams: URLSearchParams): string | null {
  const debugMessage = formatMetaDebug(searchParams.get('meta_debug'))
  const message = [
    searchParams.get('meta_message') || mapMetaError(searchParams.get('meta_error')),
    debugMessage,
  ]
    .filter(Boolean)
    .join('\n')

  return message || null
}

function formatMetaDebug(raw: string | null): string | null {
  if (!raw) return null

  try {
    const debug = JSON.parse(raw) as Record<string, unknown>
    return [
      `Debug: version=${debug.debug_version ?? 'n/a'} etapa=${debug.step ?? 'n/a'} status=${debug.status ?? 'n/a'} ${debug.status_text ?? ''}`.trim(),
      `endpoint=${debug.endpoint ?? 'n/a'}`,
      `body=${JSON.stringify(debug.body ?? null)}`,
      `redirect_uri=${debug.redirect_uri ?? 'n/a'}`,
      `code_length=${debug.code_length ?? 'n/a'} code_prefix=${debug.code_prefix ?? 'n/a'}`,
      `network_error=${JSON.stringify(debug.network_error ?? null)}`,
      `type=${debug.type ?? 'n/a'} fbtrace_id=${debug.fbtrace_id ?? 'n/a'}`,
      `attempts=${JSON.stringify(debug.attempts ?? null)}`,
      `client_id=${debug.client_id ?? 'n/a'} app_id=${formatBool(debug.has_app_id)} secret=${formatBool(debug.has_secret ?? debug.has_instagram_app_secret)} redirect=${formatBool(debug.has_redirect_uri)} content_type=${debug.content_type ?? 'n/a'}`,
      `raw_error=${JSON.stringify(debug.raw_error ?? null)}`,
    ].join('\n')
  } catch {
    return `Debug: ${raw}`
  }
}

function formatBool(value: unknown): string {
  if (value === true) return 'presente'
  if (value === false) return 'ausente'
  return 'n/a'
}

function mapMetaError(code: string | null): string | null {
  if (!code) return null

  const messages: Record<string, string> = {
    user_denied_permissions: 'Permissoes negadas na Meta. Autorize as permissoes para conectar o Instagram.',
    instagram_oauth_error: 'A Meta retornou erro ao autorizar o Instagram.',
    missing_code: 'O callback do Instagram voltou sem code. Tente conectar novamente.',
    invalid_state: 'Sessao de conexao expirada ou invalida. Tente conectar novamente.',
    invalid_oauth_state: 'Sessao de conexao expirada ou invalida. Tente conectar novamente.',
    expired_oauth_state: 'Sessao de conexao expirada. Tente conectar novamente.',
    no_instagram_business_account: 'A conta precisa ser Instagram Business ou Creator.',
    instagram_not_business_or_creator: 'A conta Instagram precisa ser Business ou Creator.',
    token_exchange_failed: 'Falha ao trocar o code pelo token do Instagram.',
    database_save_failed: 'Erro ao salvar a integracao Instagram.',
    profile_save_failed: 'Erro ao salvar os dados Instagram no perfil.',
    token_expired: 'Token expirado. Reconecte o Instagram.',
    missing_instagram_env: 'Variaveis de ambiente do Instagram OAuth nao configuradas no backend.',
    meta_app_review_required: 'O app da Meta ainda nao tem App Review aprovado para esta permissao.',
    meta_graph_error: 'A Graph API retornou erro ao conectar o Instagram.',
  }

  return messages[code] || 'Nao foi possivel concluir a autenticacao Meta.'
}
