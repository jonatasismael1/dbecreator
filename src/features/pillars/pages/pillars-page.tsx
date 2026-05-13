import { useState } from 'react'
import { Plus, Target, Trash2, Edit2, Columns3, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { usePillars, useCreatePillar, useUpdatePillar, useDeletePillar } from '../hooks/use-pillars'
import type { ContentPillar, PillarType } from '../types/pillar.types'
import { cn } from '@/lib/utils/cn'

const PILLAR_PRESETS: Array<{ type: PillarType; label: string; desc: string; color: string }> = [
  { type: 'authority', label: 'Autoridade', desc: 'Conteúdo que te posiciona como referência', color: '#2563EB' },
  { type: 'sales', label: 'Vendas', desc: 'Conteúdo que converte e gera receita', color: '#7C3AED' },
  { type: 'connection', label: 'Conexão', desc: 'Conteúdo humanizado que gera identificação', color: '#DB2777' },
  { type: 'education', label: 'Educação', desc: 'Conteúdo que ensina e entrega valor', color: '#059669' },
  { type: 'entertainment', label: 'Entretenimento', desc: 'Conteúdo leve que gera engajamento', color: '#D97706' },
]

const pillarSchema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  description: z.string().optional(),
  type: z.enum(['authority', 'sales', 'connection', 'education', 'entertainment', 'custom'] as const),
  color: z.string().min(1),
})

type PillarForm = z.infer<typeof pillarSchema>

const INPUT_CLASS = 'w-full px-4 py-2.5 rounded-lg bg-dbe-dark border border-dbe-border text-dbe-text text-sm placeholder:text-dbe-muted/50 outline-none focus:border-dbe-blue/50 transition-all'

export function PillarsPage() {
  const { workspaceId } = useWorkspaceContext()
  const { data: pillars = [], isLoading } = usePillars(workspaceId)
  const createPillar = useCreatePillar(workspaceId)
  const updatePillar = useUpdatePillar(workspaceId)
  const deletePillar = useDeletePillar(workspaceId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContentPillar | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<PillarForm>({
    resolver: zodResolver(pillarSchema),
    defaultValues: { type: 'authority', color: '#2563EB' },
  })

  const openCreate = () => { reset({ type: 'authority', color: '#2563EB' }); setEditing(null); setModalOpen(true) }
  const openEdit = (p: ContentPillar) => {
    reset({ title: p.title, description: p.description ?? '', type: p.type, color: p.color })
    setEditing(p); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = async (data: PillarForm) => {
    if (editing) {
      await updatePillar.mutateAsync({ id: editing.id, dto: { ...data, description: data.description || null } })
    } else {
      await createPillar.mutateAsync({
        ...data,
        description: data.description || null,
        is_active: true,
        position: pillars.length,
        icon: 'Target',
      })
    }
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este pilar?')) await deletePillar.mutateAsync(id)
  }

  const handleToggleActive = async (p: ContentPillar) => {
    await updatePillar.mutateAsync({ id: p.id, dto: { is_active: !p.is_active } })
  }

  const currentColor = useWatch({ control, name: 'color' })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Pilares de Conteúdo"
        description="Os eixos temáticos que guiam toda a sua estratégia."
      >
        <Button onClick={openCreate} disabled={pillars.length >= 6}>
          <Plus className="h-4 w-4" /> Novo Pilar
        </Button>
      </PageHeader>

      {/* Preset suggestions */}
      {pillars.length === 0 && (
        <div className="mb-8">
          <p className="text-sm text-dbe-muted mb-4">🚀 Comece com um dos modelos estratégicos:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PILLAR_PRESETS.map(preset => (
              <button
                key={preset.type}
                onClick={async () => {
                  await createPillar.mutateAsync({
                    title: preset.label,
                    description: preset.desc,
                    type: preset.type,
                    color: preset.color,
                    is_active: true,
                    position: pillars.length,
                    icon: 'Target',
                  })
                }}
                className="flex items-start gap-3 rounded-xl border border-dbe-border bg-dbe-navy hover:border-dbe-blue/30 hover:bg-dbe-blue/5 p-4 text-left transition-all"
              >
                <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: `${preset.color}15`, border: `1px solid ${preset.color}30` }}>
                  <Target className="h-4 w-4" style={{ color: preset.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dbe-text">{preset.label}</p>
                  <p className="text-xs text-dbe-muted mt-0.5">{preset.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-dbe-muted mt-3 text-center">Ou crie um pilar personalizado clicando em "Novo Pilar"</p>
        </div>
      )}

      {/* Pillars Grid */}
      {pillars.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-5">
            <p className="text-sm text-dbe-muted">{pillars.length}/6 pilares definidos</p>
            {pillars.length >= 3 && (
              <Badge variant="success"><CheckCircle className="h-3 w-3" /> Boa base estratégica</Badge>
            )}
          </div>
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pillars.map(pillar => (
                <motion.div
                  key={pillar.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className={cn('relative group', !pillar.is_active && 'opacity-50')}>
                    {/* Color accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: pillar.color }} />

                    <div className="flex items-start justify-between gap-2 pt-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: `${pillar.color}15`, border: `1px solid ${pillar.color}30` }}>
                          <Target className="h-4 w-4" style={{ color: pillar.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-dbe-text truncate">{pillar.title}</p>
                          <p className="text-xs text-dbe-muted capitalize">{pillar.type === 'custom' ? 'Personalizado' : pillar.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(pillar)} className="rounded-md p-1.5 text-dbe-muted hover:text-dbe-text hover:bg-white/10 transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(pillar.id)} className="rounded-md p-1.5 text-dbe-muted hover:text-dbe-red hover:bg-dbe-red/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {pillar.description && (
                      <p className="text-xs text-dbe-muted mt-3 leading-relaxed line-clamp-2">{pillar.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dbe-border/50">
                      <Badge variant={pillar.is_active ? 'success' : 'default'}>
                        {pillar.is_active ? 'Ativo' : 'Pausado'}
                      </Badge>
                      <button
                        onClick={() => handleToggleActive(pillar)}
                        className="text-xs text-dbe-muted hover:text-dbe-text transition-colors"
                      >
                        {pillar.is_active ? 'Pausar' : 'Ativar'}
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </>
      )}

      {pillars.length === 0 && <EmptyState icon={Columns3} title="Sem pilares ainda" description="Os pilares de conteúdo definem as categorias temáticas da sua estratégia." />}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-dbe-navy border border-dbe-border shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-dbe-border">
                  <h2 className="text-lg font-bold text-dbe-text">{editing ? 'Editar Pilar' : 'Novo Pilar'}</h2>
                  <button onClick={closeModal} className="text-dbe-muted hover:text-dbe-text transition-colors">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dbe-muted mb-2">Título *</label>
                    <input {...register('title')} placeholder="Ex: Autoridade, Bastidores..." className={INPUT_CLASS} />
                    {errors.title && <p className="mt-1 text-xs text-dbe-red">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dbe-muted mb-2">Descrição</label>
                    <textarea {...register('description')} rows={2} placeholder="Para que serve este pilar..." className={cn(INPUT_CLASS, 'resize-none')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dbe-muted mb-2">Tipo</label>
                      <select {...register('type')} className={INPUT_CLASS}>
                        <option value="authority">Autoridade</option>
                        <option value="sales">Vendas</option>
                        <option value="connection">Conexão</option>
                        <option value="education">Educação</option>
                        <option value="entertainment">Entretenimento</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dbe-muted mb-2">Cor</label>
                      <div className="flex items-center gap-2">
                        <input type="color" {...register('color')} className="h-10 w-14 rounded cursor-pointer bg-transparent border-0 p-0" />
                        <span className="text-sm font-mono text-dbe-muted">{currentColor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">Cancelar</Button>
                    <Button type="submit" loading={isSubmitting} className="flex-1">
                      {editing ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
