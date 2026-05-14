import { Calendar, Target, Flag, Edit, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Campaign, CampaignStatus } from '../types/campaign.types'

interface CampaignCardProps {
  campaign: Campaign
  onOpen?: (campaign: Campaign) => void
  onEdit: (campaign: Campaign) => void
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  planning: { label: 'Planejamento', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  active: { label: 'Ativa', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  paused: { label: 'Pausada', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  completed: { label: 'Concluída', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
}

export function CampaignCard({ campaign, onOpen, onEdit, onDelete }: CampaignCardProps) {
  const statusConfig = STATUS_CONFIG[campaign.status]
  
  const checklistTotal = campaign.checklist?.length || 0
  const checklistDone = campaign.checklist?.filter(c => c.completed).length || 0
  const progress = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      // Create date object handling timezone issues
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return format(date, "d 'de' MMM", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const startDate = formatDate(campaign.start_date)
  const endDate = formatDate(campaign.end_date)
  const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'Sem data'

  return (
    <Card className="p-5 flex flex-col group relative overflow-hidden cursor-pointer" onClick={() => onOpen?.(campaign)}>
      {/* Top Banner Status */}
      <div className={`absolute top-0 left-0 w-1 h-full ${statusConfig.color.split(' ')[1].replace('text-', 'bg-')}`} />
      
      <div className="flex justify-between items-start mb-3">
        <div>
          <Badge variant="default" className={`mb-2 font-normal ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          <h3 className="font-semibold text-lg text-dbe-text line-clamp-1">{campaign.title}</h3>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(event) => { event.stopPropagation(); onEdit(campaign) }} className="p-1.5 text-dbe-muted hover:text-dbe-text bg-white/5 hover:bg-white/10 rounded-md transition-colors" aria-label="Editar campanha">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={(event) => { event.stopPropagation(); onDelete(campaign.id) }} className="p-1.5 text-dbe-muted hover:text-dbe-red bg-white/5 hover:bg-dbe-red/10 rounded-md transition-colors" aria-label="Excluir campanha">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {campaign.description && (
        <p className="text-sm text-dbe-muted line-clamp-2 mb-4">
          {campaign.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-dbe-muted">
          <Calendar className="h-3.5 w-3.5 text-dbe-blue" />
          <span className="truncate">{dateRange}</span>
        </div>
        {campaign.goal && (
          <div className="flex items-center gap-2 text-xs text-dbe-muted">
            <Target className="h-3.5 w-3.5 text-amber-500" />
            <span className="truncate">{campaign.goal}</span>
          </div>
        )}
      </div>

      {/* Progress Bar for Checklist */}
      {checklistTotal > 0 && (
        <div className="mt-auto pt-4 border-t border-dbe-border">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-dbe-muted">Progresso (Tarefas)</span>
            <span className="text-dbe-text font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-dbe-blue h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-dbe-border text-xs text-dbe-muted">
        <div className="flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5" />
          <span>{campaign.scripts?.length || 0} roteiros</span>
        </div>
        <div className="flex items-center gap-1">
          {progress === 100 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          <span>{checklistDone}/{checklistTotal} concluídas</span>
        </div>
      </div>
    </Card>
  )
}
