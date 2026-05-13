import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { PerformanceMetric, CreateMetricDTO, Platform } from '../types/report.types'
import type { Script } from '@/features/scripts/types/script.types'

const metricSchema = z.object({
  script_id: z.string().min(1, 'Selecione um roteiro'),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'other']),
  published_at: z.string().min(1, 'Data de publicação é obrigatória'),
  views: z.number().min(0),
  likes: z.number().min(0),
  comments: z.number().min(0),
  shares: z.number().min(0),
  saves: z.number().min(0),
  watch_time_seconds: z.number().min(0),
  retention_rate: z.number().min(0).max(100),
  link_clicks: z.number().min(0),
})

type MetricFormData = z.infer<typeof metricSchema>

interface MetricModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateMetricDTO) => void
  metric: PerformanceMetric | null
  isLoading?: boolean
}

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube Shorts' },
  { value: 'other', label: 'Outro' },
]

export function MetricModal({ isOpen, onClose, onSave, metric, isLoading }: MetricModalProps) {
  const { workspaceId } = useWorkspaceContext()
  const { data: scripts = [] } = useScripts(workspaceId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetricFormData>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      script_id: '',
      platform: 'instagram',
      published_at: new Date().toISOString().split('T')[0],
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      watch_time_seconds: 0,
      retention_rate: 0,
      link_clicks: 0,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (metric) {
        reset({
          script_id: metric.script_id ?? '',
          platform: metric.platform,
          published_at: metric.published_at.split('T')[0],
          views: metric.views,
          likes: metric.likes,
          comments: metric.comments,
          shares: metric.shares,
          saves: metric.saves,
          watch_time_seconds: metric.watch_time_seconds,
          retention_rate: metric.retention_rate,
          link_clicks: metric.link_clicks,
        })
      } else {
        reset({
          script_id: '',
          platform: 'instagram',
          published_at: new Date().toISOString().split('T')[0],
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          watch_time_seconds: 0,
          retention_rate: 0,
          link_clicks: 0,
        })
      }
    }
  }, [isOpen, metric, reset])

  if (!isOpen) return null

  const onSubmit = (data: MetricFormData) => {
    onSave({
      ...data,
      published_at: new Date(data.published_at).toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dbe-navy border border-dbe-border rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-dbe-border">
          <h2 className="text-lg font-semibold text-dbe-text">
            {metric ? 'Editar Métricas' : 'Registrar Métricas'}
          </h2>
          <button onClick={onClose} className="text-dbe-muted hover:text-dbe-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <form id="metric-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dbe-text mb-1">Roteiro</label>
                <select
                  {...register('script_id')}
                  disabled={!!metric}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors appearance-none"
                >
                  <option value="" disabled>Selecione o roteiro publicado...</option>
                  {(scripts as Script[]).map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {errors.script_id && <p className="text-dbe-red text-xs mt-1">{errors.script_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Plataforma</label>
                <select
                  {...register('platform')}
                  disabled={!!metric}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors appearance-none"
                >
                  {PLATFORM_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Data de Publicação</label>
                <input
                  type="date"
                  {...register('published_at')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="border-t border-dbe-border pt-4">
              <h3 className="text-sm font-semibold text-dbe-text mb-3">Métricas de Engajamento</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Visualizações</label>
                  <input type="number" {...register('views', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Curtidas</label>
                  <input type="number" {...register('likes', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Comentários</label>
                  <input type="number" {...register('comments', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Compartilham.</label>
                  <input type="number" {...register('shares', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Salvamentos</label>
                  <input type="number" {...register('saves', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Cliques no Link</label>
                  <input type="number" {...register('link_clicks', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
              </div>
            </div>

            <div className="border-t border-dbe-border pt-4">
              <h3 className="text-sm font-semibold text-dbe-text mb-3">Métricas de Retenção</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Tempo Médio Visto (seg)</label>
                  <input type="number" {...register('watch_time_seconds', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
                <div>
                  <label className="block text-xs text-dbe-muted mb-1">Taxa de Retenção (%)</label>
                  <input type="number" step="0.1" {...register('retention_rate', { valueAsNumber: true })} className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-dbe-text focus:outline-none focus:border-dbe-blue" />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-dbe-border flex justify-end gap-3 bg-dbe-navy">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" form="metric-form" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Métricas'}
          </Button>
        </div>
      </div>
    </div>
  )
}
