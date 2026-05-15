import { useState } from 'react'
import {
  AlertCircle, CheckCircle2, Clock, Link2, Trash2, XCircle,
  Layers, MessageSquare, CheckCheck, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApprovals } from '../hooks/use-approvals'
import { useBatchApprovals } from '../hooks/use-batch-approvals'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useCampaigns } from '@/features/campaigns/hooks/use-campaigns'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { approvalsService } from '../services/approvals.service'
import { ApprovalBatchModal } from '../components/approval-batch-modal'
import type { ApprovalStatus, ApprovalComment, BatchStatus } from '../types/approval.types'
import type { Script } from '@/features/scripts/types/script.types'

const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  requested_changes: { label: 'Ajuste solicitado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
}

const BATCH_STATUS_CONFIG: Record<BatchStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  partially_approved: { label: 'Parcialmente aprovado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  requested_changes: { label: 'Ajustes solicitados', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

const SECTION_LABELS: Record<string, string> = {
  GANCHO: 'Gancho',
  DESENVOLVIMENTO: 'Desenvolvimento',
  CTA: 'CTA',
  GERAL: 'Geral',
}

export function ApprovalsPage() {
  const { workspaceId } = useWorkspaceContext()
  const { approvals, isLoading, createApproval, deleteApproval } = useApprovals()
  const { batches, isLoading: batchesLoading, createBatch, deleteBatch } = useBatchApprovals()
  const { data: scripts = [] } = useScripts(workspaceId)
  const { campaigns } = useCampaigns()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [selectedScript, setSelectedScript] = useState('')
  const [clientName, setClientName] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [resolvingComment, setResolvingComment] = useState<string | null>(null)

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

  const copyBatchLink = async (token: string) => {
    await copyText(buildBatchLink(token))
  }

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    setResolvingComment(commentId)
    try {
      await approvalsService.resolveComment(commentId, resolved)
    } finally {
      setResolvingComment(null)
    }
  }

  const groupCommentsBySection = (comments: ApprovalComment[]) => {
    return comments.reduce<Record<string, ApprovalComment[]>>((acc, c) => {
      const key = c.section || 'GERAL'
      if (!acc[key]) acc[key] = []
      acc[key].push(c)
      return acc
    }, {})
  }

  return (
    <div className="flex h-full flex-col gap-8">
      {/* Individual approvals section */}
      <section>
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <PageHeader
            title="Aprovações individuais"
            description="Gere links públicos temporários para enviar roteiros para revisão externa."
          />
          <Button onClick={openCreateModal}>Gerar link</Button>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-dbe-blue border-t-transparent" />
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Nenhum link gerado"
            description="Crie links de acesso para que clientes possam visualizar e comentar seus roteiros."
            action={{ label: 'Gerar link', onClick: openCreateModal }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvals.map((approval) => {
              const config = APPROVAL_STATUS_CONFIG[approval.status]
              const StatusIcon = config.icon
              const approvalUrl = buildApprovalLink(approval.token)
              const comments = approval.comments ?? []
              const unresolvedCount = comments.filter((c) => !c.resolved).length
              const isExpanded = expandedComments === approval.id

              return (
                <Card key={approval.id} className="group relative flex flex-col overflow-hidden p-5">
                  <div className="mb-3 flex items-start justify-between">
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
                    {approval.script?.title || 'Roteiro excluído'}
                  </h3>
                  <p className="text-sm text-dbe-muted">
                    Para: <span className="text-dbe-text">{approval.client_name || '—'}</span>
                  </p>

                  {/* Comments summary */}
                  {comments.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedComments(isExpanded ? null : approval.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-dbe-border/60 bg-black/10 px-3 py-2 text-xs transition-colors hover:bg-white/5"
                      >
                        <span className="flex items-center gap-2 text-dbe-muted">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {comments.length} comentário(s)
                          {unresolvedCount > 0 && (
                            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 font-medium text-amber-500">
                              {unresolvedCount} pendente(s)
                            </span>
                          )}
                        </span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-dbe-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-dbe-muted" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {Object.entries(groupCommentsBySection(comments)).map(([section, sectionComments]) => (
                            <div key={section} className="rounded-lg border border-dbe-border/40 bg-black/10 p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dbe-muted">
                                {SECTION_LABELS[section] ?? section}
                              </p>
                              {sectionComments.map((comment) => (
                                <div key={comment.id} className="mb-2 flex items-start gap-2 last:mb-0">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-dbe-text">{comment.author_name}</p>
                                    <p className={`mt-0.5 text-xs ${comment.resolved ? 'text-dbe-muted line-through' : 'text-dbe-text'}`}>
                                      {comment.content}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleResolveComment(comment.id, !comment.resolved)}
                                    disabled={resolvingComment === comment.id}
                                    title={comment.resolved ? 'Reabrir' : 'Marcar como resolvido'}
                                    className={`shrink-0 rounded-md p-1 transition-colors ${comment.resolved ? 'text-green-500 hover:text-dbe-muted' : 'text-dbe-muted hover:text-green-500'}`}
                                  >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto border-t border-dbe-border pt-3 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-dbe-muted">
                        {format(new Date(approval.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => copyLink(approval.token)}>
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Copiar link
                      </Button>
                    </div>
                    {copiedLink === approvalUrl && (
                      <p className="mt-1.5 text-xs text-dbe-green">Link copiado!</p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Batch approvals section */}
      <section>
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-dbe-text">Lotes de aprovação</h2>
            <p className="mt-0.5 text-sm text-dbe-muted">Aprove múltiplos roteiros ou campanhas inteiras com um único link.</p>
          </div>
          <Button variant="secondary" onClick={() => setIsBatchModalOpen(true)}>
            <Layers className="h-4 w-4" />
            Criar lote
          </Button>
        </div>

        {batchesLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-dbe-blue border-t-transparent" />
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Nenhum lote criado"
            description="Crie um lote para enviar múltiplos roteiros de uma campanha para aprovação de uma vez."
            action={{ label: 'Criar lote', onClick: () => setIsBatchModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {batches.map((batch) => {
              const config = BATCH_STATUS_CONFIG[batch.status]
              const batchUrl = buildBatchLink(batch.token)
              const itemCount = batch.items?.length ?? 0
              const approvedCount = batch.items?.filter((i) => i.status === 'approved').length ?? 0

              return (
                <Card key={batch.id} className="group relative flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <Badge variant="default" className={`flex items-center gap-1 font-normal ${config.color}`}>
                      {config.label}
                    </Badge>
                    <button
                      onClick={() => deleteBatch.mutateAsync(batch.id)}
                      className="rounded-md bg-white/5 p-1.5 text-dbe-muted opacity-0 transition-opacity hover:text-dbe-red group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-dbe-text">
                      {batch.campaign?.title ? `Campanha: ${batch.campaign.title}` : `Lote de ${itemCount} roteiro(s)`}
                    </h3>
                    {batch.client_name && (
                      <p className="mt-0.5 text-sm text-dbe-muted">Para: <span className="text-dbe-text">{batch.client_name}</span></p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-dbe-muted">
                    <div className="flex-1 overflow-hidden rounded-full bg-white/10" style={{ height: 4 }}>
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: itemCount > 0 ? `${(approvedCount / itemCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="shrink-0 text-xs">{approvedCount}/{itemCount} aprovados</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dbe-border pt-3">
                    <span className="text-xs text-dbe-muted">
                      {format(new Date(batch.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => copyBatchLink(batch.token)}>
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      Copiar link
                    </Button>
                  </div>
                  {copiedLink === batchUrl && (
                    <p className="text-xs text-dbe-green">Link copiado!</p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Create individual approval modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-dbe-border bg-dbe-navy">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-dbe-text">Gerar link de aprovação</h2>

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
                      .filter((s) => !s.archived_at && !['in_approval', 'approved', 'recorded'].includes(s.status))
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dbe-text">Nome do cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2 text-dbe-text transition-colors focus:border-dbe-blue focus:outline-none"
                    placeholder="Ex: João Silva"
                  />
                </div>

                {generatedLink && (
                  <div className="rounded-lg border border-dbe-green/20 bg-dbe-green/10 p-3">
                    <p className="text-xs font-medium text-dbe-green">Link gerado!</p>
                    <button type="button" onClick={() => copyText(generatedLink)} className="mt-2 break-all text-left text-xs text-dbe-text underline decoration-dbe-green/50">
                      {generatedLink}
                    </button>
                    {copiedLink === generatedLink && <p className="mt-1 text-xs text-dbe-green">Copiado!</p>}
                  </div>
                )}

                {generationError && (
                  <div className="rounded-lg border border-dbe-red/20 bg-dbe-red/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-dbe-red" />
                      <p className="text-xs text-dbe-red">{generationError}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-dbe-muted">Link válido por 7 dias. Qualquer pessoa com o link pode aprovar sem login.</p>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t border-dbe-border p-4">
              <Button variant="ghost" onClick={() => { setIsModalOpen(false); setGeneratedLink(null); setGenerationError(null) }}>
                Cancelar
              </Button>
              <Button type="submit" form="create-approval-form" loading={createApproval.isPending}>
                {createApproval.isPending ? 'Gerando...' : generationError ? 'Tentar novamente' : 'Gerar link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create batch modal */}
      <ApprovalBatchModal
        open={isBatchModalOpen}
        scripts={scripts as Script[]}
        campaigns={campaigns}
        onClose={() => setIsBatchModalOpen(false)}
        onCreate={({ campaignId, scriptIds, clientName: cn, expiresAt }) =>
          createBatch.mutateAsync({ campaignId, scriptIds, clientName: cn, expiresAt })
        }
        isLoading={createBatch.isPending}
      />
    </div>
  )
}

function buildApprovalLink(token: string) {
  return `${window.location.origin}/aprovacao/${token}`
}

function buildBatchLink(token: string) {
  return `${window.location.origin}/aprovacao/lote/${token}`
}
