import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import type { Idea, IdeaStatus } from '../types/idea.types'

const ideaSchema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'doing', 'done']),
  tagsRaw: z.string().optional(),
})

type IdeaFormValues = z.infer<typeof ideaSchema>

interface IdeaModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: { title: string; description: string | null; status: IdeaStatus; tags: string[] }) => Promise<void>
  idea?: Idea | null
}

export function IdeaModal({ open, onClose, onSave, idea }: IdeaModalProps) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: { status: 'backlog', tagsRaw: '' },
  })

  // Populate form when editing
  useEffect(() => {
    if (idea) {
      reset({ title: idea.title, description: idea.description ?? '', status: idea.status, tagsRaw: idea.tags.join(', ') })
    } else {
      reset({ title: '', description: '', status: 'backlog', tagsRaw: '' })
    }
  }, [idea, reset])

  const onSubmit = async (values: IdeaFormValues) => {
    setSaving(true)
    try {
      const tags = values.tagsRaw
        ? values.tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : []
      await onSave({ title: values.title, description: values.description || null, status: values.status, tags })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          >
            <div className="modal-panel pointer-events-auto w-full max-w-lg overflow-hidden rounded-[var(--r-xl)] border border-dbe-border bg-dbe-navy shadow-2xl">
              <div className="modal-drag-handle" />
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-dbe-border">
                <h2 className="text-lg font-bold text-dbe-text">
                  {idea ? 'Editar ideia' : 'Nova ideia'}
                </h2>
                <button onClick={onClose} className="touch-target rounded-[var(--r-md)] p-2 text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit(onSubmit)} className="modal-scroll-body space-y-5 p-6">
                <div>
                  <label className="block text-sm font-medium text-dbe-muted mb-2">Título *</label>
                  <input
                    {...register('title')}
                    placeholder="Ex: Reel sobre os erros comuns de..."
                    className="h-11 w-full rounded-[var(--r-md)] border border-dbe-border bg-dbe-dark px-4 text-[16px] text-dbe-text outline-none transition-all placeholder:text-dbe-muted/50 focus:border-dbe-blue/50 focus:ring-1 focus:ring-dbe-blue/20"
                  />
                  {errors.title && <p className="mt-1.5 text-xs text-dbe-red">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dbe-muted mb-2">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Contexto, referências, ângulo do conteúdo..."
                    className="w-full resize-none rounded-[var(--r-md)] border border-dbe-border bg-dbe-dark px-4 py-3 text-[16px] text-dbe-text outline-none transition-all placeholder:text-dbe-muted/50 focus:border-dbe-blue/50 focus:ring-1 focus:ring-dbe-blue/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-dbe-muted mb-2">Status</label>
                    <select
                      {...register('status')}
                      className="h-11 w-full rounded-[var(--r-md)] border border-dbe-border bg-dbe-dark px-4 text-[16px] text-dbe-text outline-none transition-all focus:border-dbe-blue/50"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="doing">Em andamento</option>
                      <option value="done">Concluído</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dbe-muted mb-2">Tags (vírgula)</label>
                    <input
                      {...register('tagsRaw')}
                      placeholder="venda, autoridade..."
                      className="h-11 w-full rounded-[var(--r-md)] border border-dbe-border bg-dbe-dark px-4 text-[16px] text-dbe-text outline-none transition-all placeholder:text-dbe-muted/50 focus:border-dbe-blue/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row">
                  <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving} className="flex-1">
                    <Plus className="h-4 w-4" />
                    {idea ? 'Salvar' : 'Criar ideia'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
