import { Trash2, Edit2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Idea, IdeaStatus } from '../types/idea.types'

const statusConfig: Record<IdeaStatus, { label: string; variant: 'default' | 'blue' | 'success' }> = {
  backlog: { label: 'Backlog', variant: 'default' },
  doing: { label: 'Em andamento', variant: 'blue' },
  done: { label: 'Concluído', variant: 'success' },
}

interface IdeaCardProps {
  idea: Idea
  onEdit: (idea: Idea) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: IdeaStatus) => void
}

export function IdeaCard({ idea, onEdit, onDelete, onStatusChange }: IdeaCardProps) {
  const cfg = statusConfig[idea.status]
  const nextStatus: Record<IdeaStatus, IdeaStatus> = { backlog: 'doing', doing: 'done', done: 'backlog' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-dbe-text text-sm leading-snug flex-1">{idea.title}</h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(idea)}
              className="rounded-md p-1.5 text-dbe-muted hover:text-dbe-text hover:bg-white/10 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(idea.id)}
              className="rounded-md p-1.5 text-dbe-muted hover:text-dbe-red hover:bg-dbe-red/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {idea.description && (
          <p className="text-xs text-dbe-muted mb-3 line-clamp-2 leading-relaxed">{idea.description}</p>
        )}

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {idea.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-dbe-border/60 px-2 py-0.5 text-[10px] font-medium text-dbe-muted">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dbe-border/50">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <button
            onClick={() => onStatusChange(idea.id, nextStatus[idea.status])}
            className="flex items-center gap-1 text-[11px] text-dbe-muted hover:text-dbe-blue transition-colors"
          >
            Avançar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
