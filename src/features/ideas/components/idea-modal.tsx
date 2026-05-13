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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-dbe-navy border border-dbe-border shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-dbe-border">
                <h2 className="text-lg font-bold text-dbe-text">
                  {idea ? 'Editar Ideia' : 'Nova Ideia'}
                </h2>
                <button onClick={onClose} className="rounded-lg p-2 text-dbe-muted hover:text-dbe-text hover:bg-white/5 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dbe-muted mb-2">Título *</label>
                  <input
                    {...register('title')}
                    placeholder="Ex: Reel sobre os erros comuns de..."
                    className="w-full h-11 px-4 rounded-lg bg-dbe-dark border border-dbe-border text-dbe-text text-sm placeholder:text-dbe-muted/50 outline-none focus:border-dbe-blue/50 focus:ring-1 focus:ring-dbe-blue/20 transition-all"
                  />
                  {errors.title && <p className="mt-1.5 text-xs text-dbe-red">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dbe-muted mb-2">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Contexto, referências, ângulo do conteúdo..."
                    className="w-full px-4 py-3 rounded-lg bg-dbe-dark border border-dbe-border text-dbe-text text-sm placeholder:text-dbe-muted/50 outline-none focus:border-dbe-blue/50 focus:ring-1 focus:ring-dbe-blue/20 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dbe-muted mb-2">Status</label>
                    <select
                      {...register('status')}
                      className="w-full h-11 px-4 rounded-lg bg-dbe-dark border border-dbe-border text-dbe-text text-sm outline-none focus:border-dbe-blue/50 transition-all"
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
                      className="w-full h-11 px-4 rounded-lg bg-dbe-dark border border-dbe-border text-dbe-text text-sm placeholder:text-dbe-muted/50 outline-none focus:border-dbe-blue/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving} className="flex-1">
                    <Plus className="h-4 w-4" />
                    {idea ? 'Salvar' : 'Criar Ideia'}
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
