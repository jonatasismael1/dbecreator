import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Campaign, CreateCampaignDTO, CampaignStatus } from '../types/campaign.types'

const campaignSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().nullable(),
  status: z.enum(['planning', 'active', 'completed', 'paused', 'in_approval']),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  goal: z.string().nullable(),
  checklist: z.array(z.object({
    id: z.string(),
    task: z.string().min(1, 'A tarefa não pode estar vazia'),
    completed: z.boolean()
  })),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateCampaignDTO) => void
  campaign: Campaign | null
  isLoading?: boolean
}

const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Concluída' },
  { value: 'in_approval', label: 'Em Aprovação' },
]

export function CampaignModal({ isOpen, onClose, onSave, campaign, isLoading }: CampaignModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'planning',
      start_date: '',
      end_date: '',
      goal: '',
      checklist: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'checklist'
  })

  useEffect(() => {
    if (isOpen) {
      if (campaign) {
        reset({
          title: campaign.title,
          description: campaign.description || '',
          status: campaign.status,
          start_date: campaign.start_date || '',
          end_date: campaign.end_date || '',
          goal: campaign.goal || '',
          checklist: campaign.checklist || [],
        })
      } else {
        reset({
          title: '',
          description: '',
          status: 'planning',
          start_date: '',
          end_date: '',
          goal: '',
          checklist: [],
        })
      }
    }
  }, [isOpen, campaign, reset])

  if (!isOpen) return null

  const onSubmit = (data: CampaignFormData) => {
    onSave({
      ...data,
      description: data.description || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      goal: data.goal || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="modal-panel flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--r-xl)] border border-dbe-border bg-dbe-navy">
        <div className="modal-drag-handle" />
        <div className="flex items-center justify-between p-4 border-b border-dbe-border">
          <h2 className="text-lg font-semibold text-dbe-text">
            {campaign ? 'Editar campanha' : 'Nova campanha'}
          </h2>
          <button onClick={onClose} className="touch-target rounded-[var(--r-md)] text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-scroll-body flex-1 p-4">
          <form id="campaign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dbe-text mb-1">Título</label>
                <input
                  {...register('title')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  placeholder="Nome da campanha"
                />
                {errors.title && <p className="text-dbe-red text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dbe-text mb-1">Descrição</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors resize-none"
                  placeholder="Descreva o objetivo desta campanha..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors appearance-none"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Meta / objetivo numérico</label>
                <input
                  {...register('goal')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  placeholder="Ex: 100 vendas, 5k leads"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Data de início</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Data de término</label>
                <input
                  type="date"
                  {...register('end_date')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-dbe-border">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-dbe-text">Checklist de tarefas</label>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => append({ id: crypto.randomUUID(), task: '', completed: false })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register(`checklist.${index}.completed`)}
                      className="w-4 h-4 rounded border-dbe-border bg-dbe-dark text-dbe-blue focus:ring-dbe-blue focus:ring-offset-dbe-navy"
                    />
                    <input
                      {...register(`checklist.${index}.task`)}
                      className="flex-1 bg-dbe-dark border border-dbe-border rounded-lg px-3 py-1.5 text-sm text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                      placeholder="Nova tarefa..."
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 text-dbe-muted hover:text-dbe-red transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-xs text-dbe-muted text-center py-4 bg-white/5 rounded-lg border border-dashed border-dbe-border/50">
                    Nenhuma tarefa adicionada.
                  </p>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-dbe-border bg-dbe-navy p-4 sm:flex-row">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" form="campaign-form" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar campanha'}
          </Button>
        </div>
      </div>
    </div>
  )
}
