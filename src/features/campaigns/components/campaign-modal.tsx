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
  status: z.enum(['planning', 'active', 'completed', 'paused']),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dbe-navy border border-dbe-border rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-dbe-border">
          <h2 className="text-lg font-semibold text-dbe-text">
            {campaign ? 'Editar Campanha' : 'Nova Campanha'}
          </h2>
          <button onClick={onClose} className="text-dbe-muted hover:text-dbe-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <form id="campaign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-dbe-text mb-1">Meta / Objetivo Numérico</label>
                <input
                  {...register('goal')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  placeholder="Ex: 100 vendas, 5k leads"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Data de Início</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dbe-text mb-1">Data de Término</label>
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
                <label className="block text-sm font-medium text-dbe-text">Checklist de Tarefas</label>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => append({ id: crypto.randomUUID(), task: '', completed: false })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
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

        <div className="p-4 border-t border-dbe-border flex justify-end gap-3 bg-dbe-navy">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" form="campaign-form" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Campanha'}
          </Button>
        </div>
      </div>
    </div>
  )
}
