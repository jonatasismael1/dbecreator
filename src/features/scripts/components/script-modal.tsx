import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, X } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { ContentPillar } from '@/features/pillars/types/pillar.types'
import type { Campaign } from '@/features/campaigns/types/campaign.types'
import { ScriptVersionHistory } from './script-version-history'
import type { CreateScriptDTO, Script, ScriptStatus, ScriptVersion } from '../types/script.types'

const scriptSchema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  hook: z.string().min(5, 'Gancho obrigatório'),
  body: z.string().min(10, 'Desenvolvimento obrigatório'),
  cta: z.string().min(3, 'CTA obrigatório'),
  status: z.enum(['draft', 'ready', 'in_approval', 'approved', 'changes_requested', 'recorded']),
  content_pillar_id: z.string().optional(),
  campaign_id: z.string().optional(),
})

type ScriptFormValues = z.infer<typeof scriptSchema>

interface ScriptModalProps {
  open: boolean
  script?: Script | null
  pillars: ContentPillar[]
  campaigns?: Campaign[]
  initialCampaignId?: string | null
  versions?: ScriptVersion[]
  versionsLoading?: boolean
  onClose: () => void
  onSave: (data: CreateScriptDTO) => Promise<void>
}

const inputClass = 'w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none transition-all placeholder:text-dbe-muted/50 focus:border-dbe-blue/50 focus:ring-1 focus:ring-dbe-blue/20'

export function ScriptModal({
  open,
  script,
  pillars,
  campaigns = [],
  initialCampaignId = null,
  versions = [],
  versionsLoading,
  onClose,
  onSave,
}: ScriptModalProps) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScriptFormValues>({
    resolver: zodResolver(scriptSchema),
    defaultValues: { status: 'draft', content_pillar_id: '', campaign_id: '' },
  })

  useEffect(() => {
    if (script) {
      reset({
        title: script.title,
        hook: script.hook,
        body: script.body,
        cta: script.cta,
        status: script.status,
        content_pillar_id: script.content_pillar_id ?? '',
        campaign_id: script.campaign_id ?? '',
      })
      return
    }

    reset({ title: '', hook: '', body: '', cta: '', status: 'draft', content_pillar_id: '', campaign_id: initialCampaignId ?? '' })
  }, [initialCampaignId, reset, script])

  const onSubmit = async (values: ScriptFormValues) => {
    setSaving(true)
    try {
      await onSave({
        title: values.title,
        hook: values.hook,
        body: values.body,
        cta: values.cta,
        status: values.status as ScriptStatus,
        content_pillar_id: values.content_pillar_id || null,
        campaign_id: values.campaign_id || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 24 }} className="fixed inset-0 z-50 flex items-end justify-center p-0 pointer-events-none sm:items-center sm:p-4">
            <div className="pointer-events-auto flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-dbe-border bg-dbe-navy shadow-2xl sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-dbe-border px-4 py-4 sm:px-6 sm:py-5">
                <div>
                  <h2 className="text-lg font-bold text-dbe-text">{script ? 'Editar roteiro' : 'Novo roteiro'}</h2>
                  <p className="mt-1 text-xs text-dbe-muted">Gancho, desenvolvimento, CTA e pilar estratégico.</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text" aria-label="Fechar modal">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
                <Field label="Título" error={errors.title?.message}>
                  <input {...register('title')} placeholder="Ex: 3 erros que travam seus Reels" className={inputClass} />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Campanha">
                    <select {...register('campaign_id')} className={inputClass}>
                      <option value="">Sem campanha</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Pilar de conteúdo">
                    <select {...register('content_pillar_id')} className={inputClass}>
                      <option value="">Sem pilar</option>
                      {pillars.map((pillar) => (
                        <option key={pillar.id} value={pillar.id}>{pillar.title}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Status">
                  <select {...register('status')} className={inputClass}>
                    <option value="draft">Rascunho</option>
                    <option value="ready">Pronto para aprovação</option>
                    <option value="in_approval">Enviado para aprovação</option>
                    <option value="approved">Aprovado</option>
                    <option value="changes_requested">Ajuste solicitado</option>
                    <option value="recorded">Gravado</option>
                  </select>
                </Field>

                <Field label="Gancho" error={errors.hook?.message}>
                  <textarea {...register('hook')} rows={3} placeholder="A primeira frase que para o scroll..." className={cn(inputClass, 'resize-none')} />
                </Field>

                <Field label="Desenvolvimento" error={errors.body?.message}>
                  <textarea {...register('body')} rows={7} placeholder="Contexto, promessa, prova e argumento central..." className={cn(inputClass, 'resize-y font-mono leading-relaxed')} />
                </Field>

                <Field label="CTA" error={errors.cta?.message}>
                  <textarea {...register('cta')} rows={3} placeholder="Uma ação clara para o próximo passo..." className={cn(inputClass, 'resize-none')} />
                </Field>

                {script && (
                  <ScriptVersionHistory versions={versions} isLoading={versionsLoading} />
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                  <Button type="submit" loading={saving} className="flex-1">
                    <FileText className="h-4 w-4" />
                    {script ? 'Salvar' : 'Criar roteiro'}
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

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-dbe-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-dbe-red">{error}</span>}
    </label>
  )
}
