import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Archive, FileText, Filter, Plus, Target } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { useCampaigns } from '@/features/campaigns/hooks/use-campaigns'
import { useBatchApprovals } from '@/features/approvals/hooks/use-batch-approvals'
import { useAnalyzeScript } from '@/features/deby/hooks/use-deby'
import type { AiAnalysis } from '@/features/deby/types/deby.types'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { ScriptCard } from '../components/script-card'
import { ScriptModal } from '../components/script-modal'
import {
  useArchiveScript,
  useCreateScript,
  useDeleteScript,
  useRestoreScript,
  useScriptVersions,
  useScripts,
  useUpdateScript,
} from '../hooks/use-scripts'
import type { CreateScriptDTO, Script, ScriptStatus } from '../types/script.types'

const columns: Array<{ status: ScriptStatus; title: string; description: string }> = [
  { status: 'draft', title: 'Rascunho', description: 'Ideias em construção' },
  { status: 'ready', title: 'Pronto', description: 'Pronto para aprovação' },
  { status: 'in_approval', title: 'Em aprovação', description: 'Enviado para cliente' },
  { status: 'changes_requested', title: 'Ajuste solicitado', description: 'Aguardando revisão' },
  { status: 'approved', title: 'Aprovado', description: 'Liberado pelo cliente' },
  { status: 'recorded', title: 'Gravado', description: 'Saiu do papel' },
]

type FilterStatus = 'all' | ScriptStatus

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'ready', label: 'Pronto' },
  { value: 'in_approval', label: 'Em aprovação' },
  { value: 'changes_requested', label: 'Ajuste solicitado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'recorded', label: 'Gravado' },
]

export function ScriptsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { workspaceId } = useWorkspaceContext()
  const { data: scripts = [], isLoading: scriptsLoading, isError } = useScripts(workspaceId)
  const { data: pillars = [], isLoading: pillarsLoading } = usePillars(workspaceId)
  const { campaigns, isLoading: campaignsLoading } = useCampaigns()
  const createScript = useCreateScript(workspaceId)
  const updateScript = useUpdateScript(workspaceId)
  const deleteScript = useDeleteScript(workspaceId)
  const archiveScript = useArchiveScript(workspaceId)
  const restoreScript = useRestoreScript(workspaceId)
  const { createBatch } = useBatchApprovals()
  const analyzeScript = useAnalyzeScript(workspaceId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [modalAnalysis, setModalAnalysis] = useState<AiAnalysis | null>(null)
  const [draggingScript, setDraggingScript] = useState<Script | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<ScriptStatus | null>(null)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedScriptIds, setSelectedScriptIds] = useState<Set<string>>(new Set())
  const [approvalLink, setApprovalLink] = useState<string | null>(null)
  const { data: versions = [], isLoading: versionsLoading } = useScriptVersions(workspaceId, editingScript?.id)

  const activeScripts = useMemo(() => scripts.filter((script) => !script.archived_at), [scripts])
  const archivedScripts = useMemo(() => scripts.filter((script) => script.archived_at), [scripts])
  const visibleScripts = tab === 'active' ? activeScripts : archivedScripts

  // Apply status filter
  const filteredScripts = useMemo(() => {
    if (filterStatus === 'all') return visibleScripts
    return visibleScripts.filter((s) => s.status === filterStatus)
  }, [visibleScripts, filterStatus])

  const grouped = useMemo(() => {
    return columns.reduce<Record<ScriptStatus, Script[]>>((acc, column) => {
      acc[column.status] = filteredScripts.filter((script) => script.status === column.status)
      return acc
    }, {
      draft: [],
      ready: [],
      in_approval: [],
      approved: [],
      changes_requested: [],
      recorded: [],
    } as Record<ScriptStatus, Script[]>)
  }, [filteredScripts])

  // Count per status for filter badges
  const statusCounts = useMemo(() => {
    const base = visibleScripts
    return {
      all: base.length,
      draft: base.filter(s => s.status === 'draft').length,
      ready: base.filter(s => s.status === 'ready').length,
      in_approval: base.filter(s => s.status === 'in_approval').length,
      changes_requested: base.filter(s => s.status === 'changes_requested').length,
      approved: base.filter(s => s.status === 'approved').length,
      recorded: base.filter(s => s.status === 'recorded').length,
    }
  }, [visibleScripts])

  const openCreate = () => {
    setEditingScript(null)
    setModalAnalysis(null)
    analyzeScript.reset()
    setModalOpen(true)
  }

  const openEdit = (script: Script) => {
    setEditingScript(script)
    setModalAnalysis(null)
    analyzeScript.reset()
    setModalOpen(true)
  }

  // Open edit modal from navigation state (e.g. from ScriptPreviewPage)
  useEffect(() => {
    const openEditId = location.state?.openEditId as string | undefined
    if (!openEditId || scripts.length === 0) return
    const target = scripts.find((s) => s.id === openEditId)
    if (target) {
      const timer = window.setTimeout(() => {
        openEdit(target)
        window.history.replaceState({}, '')
      }, 0)
      return () => window.clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openEditId, scripts])

  const closeModal = () => {
    setModalOpen(false)
    setEditingScript(null)
    setModalAnalysis(null)
    analyzeScript.reset()
  }

  const handleSave = async (data: CreateScriptDTO) => {
    if (editingScript) {
      await updateScript.mutateAsync({ id: editingScript.id, dto: data })
      return
    }

    await createScript.mutateAsync(data)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este roteiro?')) await deleteScript.mutateAsync(id)
  }

  const handleArchive = async (script: Script) => {
    await archiveScript.mutateAsync(script.id)
  }

  const handleRestore = async (script: Script) => {
    await restoreScript.mutateAsync(script.id)
  }

  const handleStatusChange = async (id: string, status: ScriptStatus) => {
    await updateScript.mutateAsync({ id, dto: { status } })
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>, status: ScriptStatus) => {
    event.preventDefault()
    setDragOverStatus(null)
    const scriptId = event.dataTransfer.getData('text/plain') || draggingScript?.id
    const script = scripts.find((item) => item.id === scriptId)
    if (!script || script.archived_at || script.status === status) return
    await handleStatusChange(script.id, status)
    setDraggingScript(null)
  }

  const toggleSelect = (id: string, selected: boolean) => {
    const next = new Set(selectedScriptIds)
    if (selected) next.add(id)
    else next.delete(id)
    setSelectedScriptIds(next)
  }

  const handleSendBatch = async () => {
    if (selectedScriptIds.size === 0) return
    const batch = await createBatch.mutateAsync({ scriptIds: Array.from(selectedScriptIds) })
    const link = `${window.location.origin}/aprovacao/lote/${batch.token}`
    setApprovalLink(link)
    setSelectionMode(false)
    setSelectedScriptIds(new Set())
  }

  const handleAnalyzeInModal = async (scriptId: string) => {
    try {
      const analysis = await analyzeScript.mutateAsync(scriptId)
      const script = scripts.find((item) => item.id === scriptId)
      const enriched = script
        ? { ...analysis, scripts: { id: script.id, title: script.title } }
        : analysis
      setModalAnalysis(enriched)
      return enriched
    } catch {
      setModalAnalysis(null)
      return null
    }
  }

  if (scriptsLoading || pillarsLoading || campaignsLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Erro ao carregar roteiros. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Roteiros">
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo roteiro
        </Button>
      </PageHeader>

      <div className="mb-5 grid gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-3">
        <MetricCard label="Ativos" value={activeScripts.length} />
        <MetricCard label="Pilares vinculados" value={new Set(activeScripts.map((s) => s.content_pillar_id).filter(Boolean)).size} icon={<Target className="h-4 w-4 text-success" />} />
        <MetricCard label="Em aprovação" value={grouped.in_approval.length} />
      </div>

      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant={tab === 'active' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('active'); setFilterStatus('all') }} className="w-full sm:w-auto">
            <FileText className="h-4 w-4" />
            Ativos ({activeScripts.length})
          </Button>
          <Button variant={tab === 'archived' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('archived'); setFilterStatus('all') }} className="w-full sm:w-auto">
            <Archive className="h-4 w-4" />
            Arquivados ({archivedScripts.length})
          </Button>
        </div>
        {tab === 'active' && activeScripts.length > 0 && (
          <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
            {selectionMode ? (
              <>
                <span className="text-xs text-text-muted">{selectedScriptIds.size} selecionados</span>
                <Button size="sm" variant="secondary" onClick={() => { setSelectionMode(false); setSelectedScriptIds(new Set()) }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSendBatch} loading={createBatch.isPending} disabled={selectedScriptIds.size === 0}>
                  Enviar aprovação
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setSelectionMode(true)}>
                Selecionar para aprovação
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Status Filter */}
      {tab === 'active' && (
        <div className="mb-6 flex items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <label htmlFor="status-filter" className="sr-only">Filtrar por status</label>
            <div className="group relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" />
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="h-11 w-full appearance-none rounded-2xl border border-border bg-surface pl-10 pr-10 text-sm font-medium text-text outline-none transition-all hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({statusCounts[opt.value]})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          {filterStatus !== 'all' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterStatus('all')}
              className="hidden h-11 text-xs text-text-muted hover:text-text sm:flex"
            >
              Limpar filtro
            </Button>
          )}
        </div>
      )}

      {approvalLink && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success-soft p-4">
          <h4 className="mb-2 text-sm font-semibold text-success">Link de aprovação gerado!</h4>
          <div className="flex gap-2">
            <input type="text" readOnly value={approvalLink} className="flex-1 rounded border border-success/20 bg-black/20 px-3 py-1.5 text-xs text-success outline-none" />
            <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(approvalLink); alert('Copiado!') }}>
              Copiar
            </Button>
          </div>
        </div>
      )}

      {visibleScripts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === 'archived' ? 'Nenhum roteiro arquivado' : 'Nenhum roteiro criado'}
          description={tab === 'archived' ? 'Roteiros arquivados continuam disponíveis para consulta e restauração.' : 'Crie o primeiro roteiro conectado aos seus pilares para transformar estratégia em conteúdo gravável.'}
          action={tab === 'active' ? { label: 'Novo roteiro', onClick: openCreate } : undefined}
        />
      ) : filteredScripts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum roteiro com esse status"
          description="Remova o filtro ou selecione outro status para ver os roteiros."
          action={{ label: 'Ver todos', onClick: () => setFilterStatus('all') }}
        />
      ) : (
        <div className="mt-2">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-4 lg:overflow-x-auto lg:pb-3">
          {columns
            .filter((column) => {
              // If filtering by specific status, only show that column
              if (filterStatus !== 'all') return column.status === filterStatus
              // Otherwise show all
              return true
            })
            .map((column) => (
            <section key={column.status} className="w-full lg:w-[310px] lg:shrink-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h2 className="text-sm font-semibold text-text uppercase tracking-wide">{column.title}</h2>
                  <p className="text-[11px] text-text-muted">{column.description}</p>
                </div>
                <Badge variant={column.status === 'recorded' || column.status === 'approved' ? 'success' : column.status === 'ready' || column.status === 'in_approval' ? 'primary' : 'default'}>
                  {grouped[column.status].length}
                </Badge>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOverStatus(column.status)
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(event) => handleDrop(event, column.status)}
                className={cn(
                  'min-h-[120px] space-y-3 rounded-2xl border bg-surface2/50 p-3 transition-all lg:min-h-[500px]',
                  dragOverStatus === column.status ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'
                )}
              >
                <AnimatePresence mode="popLayout">
                  {grouped[column.status].map((script) => (
                    <ScriptCard
                      key={script.id}
                      script={script}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onView={(item) => navigate(`/scripts/${item.id}`)}
                      onTeleprompter={(item) => navigate(`/teleprompter/${item.id}`)}
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                      onDragStart={setDraggingScript}
                      selectable={selectionMode && tab === 'active'}
                      selected={selectedScriptIds.has(script.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </AnimatePresence>
                {grouped[column.status].length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-text-muted bg-surface/30">
                    <span>Sem roteiros</span>
                  </div>
                )}
              </div>
            </section>
          ))}
          </div>
        </div>
      )}

      <ScriptModal
        key={editingScript?.id ?? 'new-script'}
        open={modalOpen}
        script={editingScript}
        pillars={pillars.filter((pillar) => pillar.is_active)}
        campaigns={campaigns}
        versions={versions}
        versionsLoading={versionsLoading}
        analysis={modalAnalysis}
        analysisError={analyzeScript.error instanceof Error ? analyzeScript.error : null}
        analyzing={analyzeScript.isPending}
        onAnalyze={editingScript ? handleAnalyzeInModal : undefined}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) {
  return (
    <Card className="flex min-h-20 items-center justify-between gap-2 p-3 sm:p-4">
      <div>
        <p className="text-[11px] leading-tight text-text-muted sm:text-xs">{label}</p>
        <p className="mt-1 text-xl font-bold text-text sm:text-2xl">{value}</p>
      </div>
      {icon ?? <FileText className="h-4 w-4 text-info" />}
    </Card>
  )
}
