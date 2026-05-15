import { Trash2, Edit2, ArrowRight, Sparkles, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
  onDebyDevelop?: (idea: Idea) => void
}

export function IdeaCard({ idea, onEdit, onDelete, onStatusChange, onDebyDevelop }: IdeaCardProps) {
  const navigate = useNavigate()
  const cfg = statusConfig[idea.status]
  const nextStatus: Record<IdeaStatus, IdeaStatus> = { backlog: 'doing', doing: 'done', done: 'backlog' }

  const handleCreateScript = () => {
    navigate('/scripts', {
      state: {
        fromIdea: {
          id: idea.id,
          title: idea.title,
          description: idea.description,
        },
      },
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative flex flex-col">
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

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3 mt-auto">
          {onDebyDevelop && (
            <button
              onClick={() => onDebyDevelop(idea)}
              className="tap-feedback flex flex-1 items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-dbe-green/30 bg-dbe-green/8 px-2.5 py-2 text-[11px] font-semibold text-dbe-green transition-all hover:border-dbe-green/50 hover:bg-dbe-green/15"
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>Deby AI desenvolver</span>
            </button>
          )}
          <button
            onClick={handleCreateScript}
            className="tap-feedback flex flex-1 items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-dbe-blue/30 bg-dbe-blue/8 px-2.5 py-2 text-[11px] font-semibold text-dbe-blue transition-all hover:border-dbe-blue/50 hover:bg-dbe-blue/15"
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span>Criar roteiro</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-dbe-border/50">
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
