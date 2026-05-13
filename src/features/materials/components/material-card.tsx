import { Link2, File, Music, Video, Image as ImageIcon, FileText, Trash2, Edit } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Material, MaterialType } from '../types/material.types'

interface MaterialCardProps {
  material: Material
  onEdit: (material: Material) => void
  onDelete: (id: string) => void
}

const TYPE_CONFIG: Record<MaterialType, { icon: LucideIcon; color: string; label: string }> = {
  link: { icon: Link2, color: 'text-blue-500 bg-blue-500/10', label: 'Link' },
  file: { icon: File, color: 'text-green-500 bg-green-500/10', label: 'Arquivo' },
  audio: { icon: Music, color: 'text-purple-500 bg-purple-500/10', label: 'Áudio' },
  video: { icon: Video, color: 'text-red-500 bg-red-500/10', label: 'Vídeo' },
  image: { icon: ImageIcon, color: 'text-amber-500 bg-amber-500/10', label: 'Imagem' },
  note: { icon: FileText, color: 'text-slate-400 bg-slate-400/10', label: 'Nota' },
}

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  const config = TYPE_CONFIG[material.type]
  const Icon = config.icon

  return (
    <Card className="p-4 flex flex-col group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className={`p-2 rounded-lg ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(material)}
            className="p-1.5 text-dbe-muted hover:text-dbe-text hover:bg-white/5 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(material.id)}
            className="p-1.5 text-dbe-muted hover:text-dbe-red hover:bg-dbe-red/10 rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="font-medium text-dbe-text line-clamp-2 mb-1">{material.title}</h3>
      
      {material.url && (
        <a 
          href={material.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-dbe-blue hover:underline line-clamp-1 mb-2"
        >
          {material.url}
        </a>
      )}

      {material.content && (
        <p className="text-sm text-dbe-muted line-clamp-3 mb-3 flex-1">
          {material.content}
        </p>
      )}

      <div className="mt-auto pt-3 flex flex-wrap gap-2">
        <Badge variant="default" className="text-[10px]">
          {config.label}
        </Badge>
        {material.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="default" className="text-[10px]">
            {tag}
          </Badge>
        ))}
        {material.tags.length > 2 && (
          <Badge variant="default" className="text-[10px]">
            +{material.tags.length - 2}
          </Badge>
        )}
      </div>
    </Card>
  )
}
