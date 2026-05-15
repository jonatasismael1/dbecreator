import { Archive, ArchiveRestore, ArrowRight, CalendarDays, Edit2, Eye, PlayCircle, Target, Trash2, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { Script, ScriptStatus } from '../types/script.types'

const statusConfig: Record<ScriptStatus, { label: string; variant: 'default' | 'primary' | 'success' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  ready: { label: 'Pronto', variant: 'primary' },
  in_approval: { label: 'Em aprovação', variant: 'primary' },
  approved: { label: 'Aprovado', variant: 'success' },
  changes_requested: { label: 'Ajuste solicitado', variant: 'default' },
  recorded: { label: 'Gravado', variant: 'success' },
}

const nextStatus: Record<ScriptStatus, ScriptStatus> = {
  draft: 'ready',
  ready: 'in_approval',
  in_approval: 'approved',
  approved: 'recorded',
  changes_requested: 'ready',
  recorded: 'draft',
}

interface ScriptCardProps {
  script: Script
  onEdit: (script: Script) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ScriptStatus) => void
  onView?: (script: Script) => void
  onTeleprompter?: (script: Script) => void
  onArchive?: (script: Script) => void
  onRestore?: (script: Script) => void
  onDragStart?: (script: Script) => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (id: string, selected: boolean) => void
}

export function ScriptCard({
  script,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  onTeleprompter,
  onArchive,
  onRestore,
  onDragStart,
  selectable,
  selected,
  onToggleSelect,
}: ScriptCardProps) {
  const pillar = script.content_pillars
  const cfg = statusConfig[script.status]
  const isArchived = Boolean(script.archived_at)

  return (
    <div
      draggable={!isArchived}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', script.id)
        onDragStart?.(script)
      }}
      className={cn(!isArchived && 'cursor-grab active:cursor-grabbing')}
    >
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <Card onClick={() => onView?.(script)} className={cn('group p-3 sm:p-4', onView && 'cursor-pointer', selected && 'ring-2 ring-primary')}>
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {selectable && (
              <input
                type="checkbox"
                className="mt-1 shrink-0 rounded border-border bg-black/20 text-primary outline-none"
                checked={selected}
                onChange={(e) => onToggleSelect?.(script.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="min-w-0">
              <h3 className="line-clamp-2 break-words text-sm font-semibold leading-snug text-text">{script.title}</h3>
            {pillar && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                <Target className="h-3.5 w-3.5" style={{ color: pillar.color }} />
                <span className="truncate">{pillar.title}</span>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          {script.posting_date && (
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Postagem: {new Date(script.posting_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {script.campaigns && (
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Zap className="h-3.5 w-3.5" />
              <span className="truncate">Campanha: {script.campaigns.title}</span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1 rounded-xl border border-border/60 bg-surface-muted/50 p-1" onClick={(event) => event.stopPropagation()}>
          <button onClick={event => { event.stopPropagation(); onView?.(script); }} className="inline-flex h-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text" title="Visualizar" aria-label="Visualizar roteiro">
            <Eye className="h-4 w-4" strokeWidth={2} />
          </button>
          <button onClick={event => { event.stopPropagation(); onTeleprompter?.(script); }} className="inline-flex h-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-primary-soft hover:text-primary" title="Teleprompter" aria-label="Abrir teleprompter">
            <PlayCircle className="h-4 w-4" strokeWidth={2} />
          </button>
          {isArchived ? (
            <button onClick={() => onRestore?.(script)} className="inline-flex h-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-success-soft hover:text-success" title="Restaurar" aria-label="Restaurar roteiro">
              <ArchiveRestore className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : (
            <button onClick={() => onArchive?.(script)} className="inline-flex h-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text" title="Arquivar" aria-label="Arquivar roteiro">
              <Archive className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
          <button onClick={() => onEdit(script)} className="inline-flex h-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text" title="Editar" aria-label="Editar roteiro">
            <Edit2 className="h-4 w-4" strokeWidth={2} />
          </button>
          <button onClick={() => onDelete(script.id)} className="inline-flex h-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-soft hover:text-danger" title="Excluir" aria-label="Excluir roteiro">
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 sm:mt-4">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          {isArchived ? (
            <span className="text-[11px] text-text-muted">Arquivado</span>
          ) : (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onStatusChange(script.id, nextStatus[script.status])
              }}
              className="flex items-center gap-1 text-[11px] font-medium text-text-muted transition-colors hover:text-primary"
              aria-label={`Avançar roteiro para ${statusConfig[nextStatus[script.status]].label}`}
            >
              Avançar <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </Card>
    </motion.div>
    </div>
  )
}
