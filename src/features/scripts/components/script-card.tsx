import { Archive, ArchiveRestore, ArrowRight, Edit2, Eye, MonitorPlay, Target, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { Script, ScriptStatus } from '../types/script.types'
import { stripHtml } from '../utils/script-content'

const statusConfig: Record<ScriptStatus, { label: string; variant: 'default' | 'blue' | 'success' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  ready: { label: 'Pronto', variant: 'blue' },
  in_approval: { label: 'Em aprovação', variant: 'blue' },
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
      <Card onClick={() => onView?.(script)} className={cn('group p-3 sm:p-4', onView && 'cursor-pointer', selected && 'ring-2 ring-dbe-blue')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {selectable && (
              <input
                type="checkbox"
                className="mt-1 shrink-0 rounded border-dbe-border bg-black/20 text-dbe-blue outline-none"
                checked={selected}
                onChange={(e) => onToggleSelect?.(script.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-dbe-text">{script.title}</h3>
            {pillar && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-dbe-muted">
                <Target className="h-3.5 w-3.5" style={{ color: pillar.color }} />
                <span className="truncate">{pillar.title}</span>
              </div>
            )}
            {script.campaigns && (
              <p className="mt-1 truncate text-xs text-dbe-muted">
                Campanha: {script.campaigns.title}
              </p>
            )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => onView?.(script)} className="hidden rounded-md p-1.5 text-dbe-muted transition-colors hover:bg-white/10 hover:text-dbe-text sm:inline-flex" title="Visualizar" aria-label="Visualizar roteiro">
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onTeleprompter?.(script)} className="rounded-md p-1.5 text-dbe-muted transition-colors hover:bg-dbe-blue/10 hover:text-dbe-blue" title="Teleprompter" aria-label="Abrir teleprompter">
              <MonitorPlay className="h-3.5 w-3.5" />
            </button>
            {isArchived ? (
              <button onClick={() => onRestore?.(script)} className="rounded-md p-1.5 text-dbe-muted transition-colors hover:bg-dbe-green/10 hover:text-dbe-green" title="Restaurar" aria-label="Restaurar roteiro">
                <ArchiveRestore className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={() => onArchive?.(script)} className="rounded-md p-1.5 text-dbe-muted transition-colors hover:bg-white/10 hover:text-dbe-text" title="Arquivar" aria-label="Arquivar roteiro">
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => onEdit(script)} className="rounded-md p-1.5 text-dbe-muted transition-colors hover:bg-white/10 hover:text-dbe-text" title="Editar" aria-label="Editar roteiro">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(script.id)} className="rounded-md p-1.5 text-dbe-muted transition-colors hover:bg-dbe-red/10 hover:text-dbe-red" title="Excluir" aria-label="Excluir roteiro">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <div className="sm:hidden">
            <p className="line-clamp-2 text-xs leading-relaxed text-dbe-muted">{stripHtml(script.hook)}</p>
          </div>
          <div className="hidden space-y-3 sm:block">
            <ScriptExcerpt label="Gancho" value={script.hook} />
            <ScriptExcerpt label="Desenvolvimento" value={script.body} />
            <ScriptExcerpt label="CTA" value={script.cta} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-dbe-border/50 pt-3 sm:mt-4">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          {isArchived ? (
            <span className="text-[11px] text-dbe-muted">Arquivado</span>
          ) : (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onStatusChange(script.id, nextStatus[script.status])
              }}
              className="flex items-center gap-1 text-[11px] text-dbe-muted transition-colors hover:text-dbe-blue"
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

function ScriptExcerpt({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-dbe-muted/70">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-dbe-muted">{stripHtml(value)}</p>
    </div>
  )
}
