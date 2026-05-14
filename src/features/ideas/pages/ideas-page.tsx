import { useState } from 'react'
import { Plus, Lightbulb, LayoutGrid, List, Filter } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/features/auth/context/auth-context'
import { useWorkspace } from '@/features/workspaces/hooks/use-workspace'
import { useIdeas, useCreateIdea, useUpdateIdea, useDeleteIdea } from '../hooks/use-ideas'
import { IdeaCard } from '../components/idea-card'
import { IdeaModal } from '../components/idea-modal'
import type { Idea, IdeaStatus } from '../types/idea.types'

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | IdeaStatus

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'doing', label: 'Em andamento' },
  { value: 'done', label: 'Concluídas' },
]

export function IdeasPage() {
  const { user } = useAuth()
  const { data: workspace, isLoading: wsLoading } = useWorkspace()
  const workspaceId = workspace?.id ?? ''

  const { data: ideas = [], isLoading, isError } = useIdeas(workspaceId)
  const createIdea = useCreateIdea(workspaceId)
  const updateIdea = useUpdateIdea(workspaceId)
  const deleteIdea = useDeleteIdea(workspaceId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const filteredIdeas = filterStatus === 'all'
    ? ideas
    : ideas.filter((i) => i.status === filterStatus)

  const counts = {
    all: ideas.length,
    backlog: ideas.filter((i) => i.status === 'backlog').length,
    doing: ideas.filter((i) => i.status === 'doing').length,
    done: ideas.filter((i) => i.status === 'done').length,
  }

  const handleOpenCreate = () => { setEditingIdea(null); setModalOpen(true) }
  const handleOpenEdit = (idea: Idea) => { setEditingIdea(idea); setModalOpen(true) }
  const handleClose = () => { setModalOpen(false); setEditingIdea(null) }

  const handleSave = async (data: { title: string; description: string | null; status: IdeaStatus; tags: string[] }) => {
    if (editingIdea) {
      await updateIdea.mutateAsync({ id: editingIdea.id, dto: data })
    } else {
      await createIdea.mutateAsync({ userId: user!.id, dto: data })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que quer excluir esta ideia?')) {
      await deleteIdea.mutateAsync(id)
    }
  }

  const handleStatusChange = async (id: string, status: IdeaStatus) => {
    await updateIdea.mutateAsync({ id, dto: { status } })
  }

  if (isLoading || wsLoading) return <LoadingState />

  if (isError) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-dbe-muted text-sm">Erro ao carregar ideias. Tente novamente.</p>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Central de ideias"
        description="Capture e organize suas melhores ideias de conteúdo."
      >
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Nova ideia
        </Button>
      </PageHeader>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-dbe-muted shrink-0" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                filterStatus === opt.value
                  ? 'bg-dbe-blue/10 text-dbe-blue border border-dbe-blue/20'
                  : 'text-dbe-muted hover:text-dbe-text border border-transparent hover:bg-white/5'
              )}
            >
              {opt.label}
              <Badge variant={filterStatus === opt.value ? 'blue' : 'default'} className="text-[10px] px-1.5 py-0">
                {counts[opt.value]}
              </Badge>
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-dbe-navy border border-dbe-border p-1 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('rounded-md p-2 transition-colors', viewMode === 'grid' ? 'bg-dbe-blue/10 text-dbe-blue' : 'text-dbe-muted hover:text-dbe-text')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('rounded-md p-2 transition-colors', viewMode === 'list' ? 'bg-dbe-blue/10 text-dbe-blue' : 'text-dbe-muted hover:text-dbe-text')}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredIdeas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={filterStatus === 'all' ? 'Nenhuma ideia ainda' : `Nenhuma ideia em "${filterStatus}"`}
          description="Capture qualquer insight que possa virar conteúdo estratégico. Não filtre agora — anote tudo."
          action={{ label: 'Nova ideia', onClick: handleOpenCreate }}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-3'
          )}>
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Modal */}
      <IdeaModal
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        idea={editingIdea}
      />
    </div>
  )
}
