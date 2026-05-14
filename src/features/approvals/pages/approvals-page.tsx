import { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Link2, Trash2, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApprovals } from '../hooks/use-approvals'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { ApprovalStatus } from '../types/approval.types'
import type { Script } from '@/features/scripts/types/script.types'

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  requested_changes: { label: 'Ajuste solicitado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
}

export function ApprovalsPage() {
  const { workspaceId } = useWorkspaceContext()
  const { approvals, isLoading, createApproval, deleteApproval } = useApprovals()
  const { data: scripts = [] } = useScripts(workspaceId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedScript, setSelectedScript] = useState('')
  const [clientName, setClientName] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const openCreateModal = () => {
    setGeneratedLink(null)
    setGenerationError(null)
    setCopiedLink(null)
    setIsModalOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScript) return

    setGenerationError(null)
    setCopiedLink(null)

    try {
      const approval = await createApproval.mutateAsync({
        script_id: selectedScript,
        client_name: clientName,
        client_email: null,
        expires_at: null,
      })
      setGeneratedLink(buildApprovalLink(approval.token))
      setSelectedScript('')
      setClientName('')
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Nao foi possivel gerar o link. Tente novamente.')
    }
  }

  const copyText = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedLink(url)
  }

  const copyLink = async (token: string) => {
    await copyText(buildApprovalLink(token))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          title="Aprovacoes de clientes"
          description="Gere links publicos temporarios para enviar seus roteiros para revisao externa."
        />
        <Button onClick={openCreateModal}>
          Gerar novo link
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dbe-blue border-t-transparent" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={Link2}
            title="Nenhum link gerado"
            description="Crie links de acesso para que clientes possam visualizar e comentar seus roteiros sem precisar de login."
            action={{
              label: 'Gerar link',
              onClick: openCreateModal,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {approvals.map((approval) => {
            const config = STATUS_CONFIG[approval.status]
            const StatusIcon = config.icon
            const approvalUrl = buildApprovalLink(approval.token)

            return (
              <Card key={approval.id} className="group relative flex flex-col overflow-hidden p-5">
                <div className="mb-4 flex items-start justify-between">
                  <Badge variant="default" className={`flex items-center gap-1 font-normal ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                  <button
                    onClick={() => deleteApproval.mutateAsync(approval.id)}
                    className="rounded-md bg-white/5 p-1.5 text-dbe-muted opacity-0 transition-opacity hover:text-dbe-red group-hover:opacity-100"
                    title="Excluir link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="mb-1 truncate font-semibold text-dbe-text" title={approval.script?.title}>
                  {approval.script?.title || 'Roteiro excluido'}
                </h3>
                <p className="mb-6 text-sm text-dbe-muted">
                  Enviado para: <span className="text-dbe-text">{approval.client_name}</span>
                </p>

                <div className="mt-auto border-t border-dbe-border pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-dbe-muted">
                      Gerado em: {format(new Date(approval.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => copyLink(approval.token)}>
                      <Link2 className="mr-2 h-3.5 w-3.5" />
                      Copiar link
                    </Button>
                  </div>
                  {copiedLink === approvalUrl && (
                    <p className="text-xs text-dbe-green">Link copiado para a area de transferencia.</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-dbe-border bg-dbe-navy">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-dbe-text">Gerar link de aprovacao</h2>

              <form id="create-approval-form" onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dbe-text">Roteiro</label>
                  <select
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    required
                    className="w-full appearance-none rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2 text-dbe-text transition-colors focus:border-dbe-blue focus:outline-none"
                  >
                    <option value="" disabled>Selecione um roteiro...</option>
                    {(scripts as Script[])
                      .filter((script) => !script.archived_at && !['in_approval', 'approved', 'recorded'].includes(script.status))
                      .map((script) => (
                        <option key={script.id} value={script.id}>{script.title}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dbe-text">Nome do cliente/aprovador</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2 text-dbe-text transition-colors focus:border-dbe-blue focus:outline-none"
                    placeholder="Ex: Joao Silva"
                  />
                </div>

                {generatedLink && (
                  <div className="rounded-lg border border-dbe-green/20 bg-dbe-green/10 p-3">
                    <p className="text-xs font-medium text-dbe-green">Link de aprovacao gerado.</p>
                    <button
                      type="button"
                      onClick={() => copyText(generatedLink)}
                      className="mt-2 break-all text-left text-xs text-dbe-text underline decoration-dbe-green/50"
                    >
                      {generatedLink}
                    </button>
                    {copiedLink === generatedLink && (
                      <p className="mt-2 text-xs text-dbe-green">Link copiado para a area de transferencia.</p>
                    )}
                  </div>
                )}

                {generationError && (
                  <div className="rounded-lg border border-dbe-red/20 bg-dbe-red/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-dbe-red" />
                      <div>
                        <p className="text-xs font-medium text-dbe-red">Nao foi possivel gerar o link.</p>
                        <p className="mt-1 text-xs text-dbe-muted">{generationError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="mt-2 text-xs text-dbe-muted">
                  O link gerado sera valido por 7 dias. Qualquer pessoa com o link podera visualizar o roteiro e aprovar ou solicitar ajustes.
                </p>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t border-dbe-border bg-dbe-navy p-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false)
                  setGeneratedLink(null)
                  setGenerationError(null)
                  setCopiedLink(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" form="create-approval-form" loading={createApproval.isPending}>
                {createApproval.isPending ? 'Gerando link...' : generationError ? 'Tentar novamente' : 'Gerar link'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildApprovalLink(token: string) {
  return `${window.location.origin}/aprovacao/${token}`
}
