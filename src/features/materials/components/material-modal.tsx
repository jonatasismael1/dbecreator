import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Material, CreateMaterialDTO, MaterialType } from '../types/material.types'

const materialSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  type: z.enum(['link', 'file', 'audio', 'video', 'image', 'note']),
  url: z.string().url('URL inválida').or(z.literal('')).nullable(),
  content: z.string().nullable(),
  tags: z.array(z.string()),
})

type MaterialFormData = z.infer<typeof materialSchema>

interface MaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateMaterialDTO) => void
  material: Material | null
  isLoading?: boolean
}

const TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'link', label: 'Link' },
  { value: 'file', label: 'Arquivo' },
  { value: 'audio', label: 'Áudio' },
  { value: 'video', label: 'Vídeo' },
  { value: 'image', label: 'Imagem' },
  { value: 'note', label: 'Nota' },
]

export function MaterialModal({ isOpen, onClose, onSave, material, isLoading }: MaterialModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: '',
      type: 'link',
      url: '',
      content: '',
      tags: [],
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (material) {
        reset({
          title: material.title,
          type: material.type,
          url: material.url || '',
          content: material.content || '',
          tags: material.tags || [],
        })
      } else {
        reset({
          title: '',
          type: 'link',
          url: '',
          content: '',
          tags: [],
        })
      }
    }
  }, [isOpen, material, reset])

  const tags = useWatch({ control, name: 'tags' }) ?? []

  if (!isOpen) return null

  const onSubmit = (data: MaterialFormData) => {
    onSave({
      ...data,
      url: data.url || null,
      content: data.content || null,
    })
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = e.currentTarget.value.trim()
      if (value && !tags.includes(value)) {
        setValue('tags', [...tags, value])
      }
      e.currentTarget.value = ''
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', tags.filter((t) => t !== tagToRemove))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dbe-navy border border-dbe-border rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-dbe-border">
          <h2 className="text-lg font-semibold text-dbe-text">
            {material ? 'Editar Material' : 'Novo Material'}
          </h2>
          <button
            onClick={onClose}
            className="text-dbe-muted hover:text-dbe-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <form id="material-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dbe-text mb-1">
                Título
              </label>
              <input
                {...register('title')}
                className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                placeholder="Ex: Referência de Iluminação"
              />
              {errors.title && (
                <p className="text-dbe-red text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dbe-text mb-1">
                Tipo
              </label>
              <select
                {...register('type')}
                className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors appearance-none"
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dbe-text mb-1">
                URL (Opcional)
              </label>
              <input
                {...register('url')}
                className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                placeholder="https://"
              />
              {errors.url && (
                <p className="text-dbe-red text-xs mt-1">{errors.url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dbe-text mb-1">
                Conteúdo / Notas (Opcional)
              </label>
              <textarea
                {...register('content')}
                rows={4}
                className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors resize-none"
                placeholder="Adicione anotações sobre este material..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dbe-text mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-dbe-muted"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-dbe-muted hover:text-dbe-text"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                onKeyDown={handleAddTag}
                className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                placeholder="Digite uma tag e aperte Enter"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-dbe-border flex justify-end gap-3 bg-dbe-navy">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" form="material-form" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Material'}
          </Button>
        </div>
      </div>
    </div>
  )
}
