import { useMemo, useState, type DragEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Archive, FileText, Plus, Target } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { useCampaigns } from '@/features/campaigns/hooks/use-campaigns'
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

export function ScriptsPage() {
  const navigate = useNavigate()
  const { workspaceId } = useWorkspaceContext()
  const { data: scripts = [], isLoading: scriptsLoading, isError } = useScripts(workspaceId)
  const { data: pillars = [], isLoading: pillarsLoading } = usePillars(workspaceId)
  const { campaigns, isLoading: campaignsLoading } = useCampaigns()
  const createScript = useCreateScript(workspaceId)
  const updateScript = useUpdateScript(workspaceId)
  const deleteScript = useDeleteScript(workspaceId)
  const archiveScript = useArchiveScript(workspaceId)
  const restoreScript = useRestoreScript(workspaceId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [draggingScript, setDraggingScript] = useState<Script | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<ScriptStatus | null>(null)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const { data: versions = [], isLoading: versionsLoading } = useScriptVersions(workspaceId, editingScript?.id)

  const activeScripts = useMemo(() => scripts.filter((script) => !script.archived_at), [scripts])
  const archivedScripts = useMemo(() => scripts.filter((script) => script.archived_at), [scripts])
  const visibleScripts = tab === 'active' ? activeScripts : archivedScripts

  const grouped = useMemo(() => {
    return columns.reduce<Record<ScriptStatus, Script[]>>((acc, column) => {
      acc[column.status] = visibleScripts.filter((script) => script.status === column.status)
      return acc
    }, {
      draft: [],
      ready: [],
      in_approval: [],
      approved: [],
      changes_requested: [],
      recorded: [],
    } as Record<ScriptStatus, Script[]>)
  }, [visibleScripts])

  const openCreate = () => {
    setEditingScript(null)
    setModalOpen(true)
  }

  const openEdit = (script: Script) => {
    setEditingScript(script)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingScript(null)
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

  if (scriptsLoading || pillarsLoading || campaignsLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-dbe-muted">Erro ao carregar roteiros. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Roteiros" description="Construa Reels com gancho, desenvolvimento, CTA e pilar estratégico.">
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo roteiro
        </Button>
      </PageHeader>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
        <MetricCard label="Ativos" value={activeScripts.length} />
        <MetricCard label="Pilares vinculados" value={new Set(activeScripts.map((s) => s.content_pillar_id).filter(Boolean)).size} icon={<Target className="h-4 w-4 text-dbe-green" />} />
        <MetricCard label="Em aprovação" value={grouped.in_approval.length} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button variant={tab === 'active' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('active')} className="w-full sm:w-auto">
          <FileText className="h-4 w-4" />
          Ativos ({activeScripts.length})
        </Button>
        <Button variant={tab === 'archived' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('archived')} className="w-full sm:w-auto">
          <Archive className="h-4 w-4" />
          Arquivados ({archivedScripts.length})
        </Button>
      </div>

      {visibleScripts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === 'archived' ? 'Nenhum roteiro arquivado' : 'Nenhum roteiro criado'}
          description={tab === 'archived' ? 'Roteiros arquivados continuam disponíveis para consulta e restauração.' : 'Crie o primeiro roteiro conectado aos seus pilares para transformar estratégia em conteúdo gravável.'}
          action={tab === 'active' ? { label: 'Novo roteiro', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 lg:overflow-visible">
          <div className="flex snap-x snap-mandatory gap-3 xl:grid xl:grid-cols-6 xl:gap-4">
          {columns.map((column) => (
            <section key={column.status} className="w-[min(82vw,22rem)] shrink-0 snap-start xl:w-auto xl:min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-dbe-text">{column.title}</h2>
                  <p className="text-xs text-dbe-muted">{column.description}</p>
                </div>
                <Badge variant={column.status === 'recorded' || column.status === 'approved' ? 'success' : column.status === 'ready' || column.status === 'in_approval' ? 'blue' : 'default'}>
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
                className={[
                  'min-h-40 space-y-3 rounded-xl border bg-dbe-dark/40 p-2.5 transition-all sm:p-3',
                  dragOverStatus === column.status ? 'border-dbe-blue bg-dbe-blue/5' : 'border-dbe-border',
                ].join(' ')}
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
                    />
                  ))}
                </AnimatePresence>
                {grouped[column.status].length === 0 && (
                  <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-dbe-border text-xs text-dbe-muted">
                    <span className="sm:hidden">Sem roteiros</span>
                    <span className="hidden sm:inline">Arraste um roteiro para cá</span>
                  </div>
                )}
              </div>
            </section>
          ))}
          </div>
        </div>
      )}

      <ScriptModal
        open={modalOpen}
        script={editingScript}
        pillars={pillars.filter((pillar) => pillar.is_active)}
        campaigns={campaigns}
        versions={versions}
        versionsLoading={versionsLoading}
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
        <p className="text-[11px] leading-tight text-dbe-muted sm:text-xs">{label}</p>
        <p className="mt-1 text-xl font-bold text-dbe-text sm:text-2xl">{value}</p>
      </div>
      {icon ?? <FileText className="h-4 w-4 text-dbe-blue" />}
    </Card>
  )
}
