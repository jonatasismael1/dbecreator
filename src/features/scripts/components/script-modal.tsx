import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { BrainCircuit, FileText, Sparkles, Wand2, X } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DebyAnalysisResult } from '@/features/deby/components/deby-analysis-result'
import { debyService } from '@/features/deby/services/deby.service'
import type { AiAnalysis } from '@/features/deby/types/deby.types'
import type { ContentPillar } from '@/features/pillars/types/pillar.types'
import type { Campaign } from '@/features/campaigns/types/campaign.types'
import { ScriptVersionHistory } from './script-version-history'
import { RichTextEditor } from './rich-text-editor'
import { useTemplates } from '../hooks/use-templates'
import { usePresence } from '../hooks/use-presence'
import { useFieldLocking } from '../hooks/use-field-locking'
import type { CreateScriptDTO, Script, ScriptStatus, ScriptVersion } from '../types/script.types'
import { stripHtml } from '../utils/script-content'

const scriptSchema = z.object({
  title: z.string().min(2, 'Titulo obrigatorio'),
  hook: z.string().min(5, 'Gancho obrigatorio'),
  body: z.string().min(10, 'Desenvolvimento obrigatorio'),
  cta: z.string().min(3, 'CTA obrigatorio'),
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
  analysis?: AiAnalysis | null
  analysisError?: Error | null
  analyzing?: boolean
  onAnalyze?: (scriptId: string) => Promise<AiAnalysis | null>
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
  analysis,
  analysisError,
  analyzing,
  onAnalyze,
  onClose,
  onSave,
}: ScriptModalProps) {
  const [saving, setSaving] = useState(false)
  const [showDebyPanel, setShowDebyPanel] = useState(false)

  // P3.1 — Templates
  const { templates, isLoading: templatesLoading } = useTemplates()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // P3.2 — Collaboration
  const { onlineUsers } = usePresence(script?.id)
  const { lockedFields, lockField, unlockField } = useFieldLocking(script?.id)

  // P2.2 — Inline Deby suggestions
  const [hookSuggestions, setHookSuggestions] = useState<string[]>([])
  const [hookSuggestionsLoading, setHookSuggestionsLoading] = useState(false)
  const [hookSuggestionsError, setHookSuggestionsError] = useState<string | null>(null)
  const [showHookSuggestions, setShowHookSuggestions] = useState(false)

  const [ctaOptimization, setCtaOptimization] = useState<{ optimized_cta: string; explanation: string } | null>(null)
  const [ctaOptimizationLoading, setCtaOptimizationLoading] = useState(false)
  const [ctaOptimizationError, setCtaOptimizationError] = useState<string | null>(null)
  const [showCtaOptimization, setShowCtaOptimization] = useState(false)

  const [bodySuggestions, setBodySuggestions] = useState<string[]>([])
  const [bodySuggestionsLoading, setBodySuggestionsLoading] = useState(false)
  const [bodySuggestionsError, setBodySuggestionsError] = useState<string | null>(null)
  const [showBodySuggestions, setShowBodySuggestions] = useState(false)

  const { control, register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<ScriptFormValues>({
    resolver: zodResolver(scriptSchema),
    defaultValues: { status: 'draft', content_pillar_id: '', campaign_id: '' },
  })
  const watchedHook = useWatch({ control, name: 'hook' }) || ''
  const watchedBody = useWatch({ control, name: 'body' }) || ''
  const watchedCta = useWatch({ control, name: 'cta' }) || ''

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

  const canAnalyze = Boolean(script?.id && onAnalyze && !isDirty)
  const analysisStatus = analyzing
    ? 'loading'
    : analysisError
      ? 'error'
      : showDebyPanel && analysis
        ? 'success'
        : 'idle'

  const handleAnalyze = async () => {
    if (!script?.id || !onAnalyze || isDirty) return
    setShowDebyPanel(true)
    await onAnalyze(script.id).catch(() => null)
  }

  const applyDebySuggestions = () => {
    if (!analysis) return
    setValue('hook', analysis.result.improved_hook || '', { shouldDirty: true, shouldValidate: true })
    setValue('body', analysis.result.rewritten_script || '', { shouldDirty: true, shouldValidate: true })
    setValue('cta', analysis.result.improved_cta || '', { shouldDirty: true, shouldValidate: true })
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value
    setSelectedTemplateId(templateId)
    
    if (!templateId) return
    
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setValue('title', template.title, { shouldDirty: true })
      setValue('hook', template.hook_template, { shouldDirty: true })
      setValue('body', template.body_template, { shouldDirty: true })
      setValue('cta', template.cta_template, { shouldDirty: true })
    }
  }

  const handleSuggestHook = async () => {
    const topic = stripHtml(watchedHook).trim() || stripHtml(watchedBody).trim()
    if (!topic) return
    setHookSuggestionsLoading(true)
    setHookSuggestionsError(null)
    setShowHookSuggestions(true)
    try {
      const hooks = await debyService.suggestHook(topic.slice(0, 200))
      setHookSuggestions(hooks)
    } catch {
      setHookSuggestionsError('Não foi possível gerar sugestões. Tente novamente.')
    } finally {
      setHookSuggestionsLoading(false)
    }
  }

  const handleOptimizeCta = async () => {
    const ctaText = stripHtml(watchedCta).trim()
    if (!ctaText) return
    setCtaOptimizationLoading(true)
    setCtaOptimizationError(null)
    setShowCtaOptimization(true)
    try {
      const result = await debyService.optimizeCta(ctaText, stripHtml(watchedBody).slice(0, 300))
      setCtaOptimization(result)
    } catch {
      setCtaOptimizationError('Não foi possível otimizar o CTA. Tente novamente.')
    } finally {
      setCtaOptimizationLoading(false)
    }
  }

  const handleReviewBody = async () => {
    const bodyText = stripHtml(watchedBody).trim()
    if (!bodyText) return
    setBodySuggestionsLoading(true)
    setBodySuggestionsError(null)
    setShowBodySuggestions(true)
    try {
      const suggestions = await debyService.suggestHook(bodyText.slice(0, 300), 'Revisar e sugerir melhorias no desenvolvimento do roteiro')
      setBodySuggestions(suggestions)
    } catch {
      setBodySuggestionsError('Não foi possível revisar. Tente novamente.')
    } finally {
      setBodySuggestionsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 24 }} className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="pointer-events-auto flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-dbe-border bg-dbe-navy shadow-2xl sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-dbe-border px-4 py-4 sm:px-6 sm:py-5">
                <div>
                  <h2 className="text-lg font-bold text-dbe-text">{script ? 'Editar roteiro' : 'Novo roteiro'}</h2>
                  <p className="mt-1 text-xs text-dbe-muted">Gancho, desenvolvimento, CTA e pilar estrategico.</p>
                </div>
                <div className="flex items-center gap-4">
                  {onlineUsers && onlineUsers.length > 0 && (
                    <div className="flex items-center -space-x-2 mr-2">
                      {onlineUsers.map(u => (
                        <div key={u.id} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dbe-navy bg-dbe-blue text-[10px] font-bold text-white uppercase" title={u.email}>
                          {u.email.substring(0, 2)}
                        </div>
                      ))}
                      <span className="ml-3 text-[10px] text-dbe-muted">Online agora</span>
                    </div>
                  )}
                  <button onClick={onClose} className="rounded-lg p-2 text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text" aria-label="Fechar modal">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
                {!script && templates && templates.length > 0 && (
                  <div className="rounded-xl border border-dbe-blue/20 bg-dbe-blue/5 p-4 mb-2">
                    <Field label="Usar um Template (Opcional)">
                      <select 
                        value={selectedTemplateId} 
                        onChange={handleTemplateChange}
                        disabled={templatesLoading}
                        className={inputClass}
                      >
                        <option value="">Começar do zero</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                <Field label="Titulo" error={errors.title?.message}>
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
                  <Field label="Pilar de conteudo">
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
                    <option value="ready">Pronto para aprovacao</option>
                    <option value="in_approval">Enviado para aprovacao</option>
                    <option value="approved">Aprovado</option>
                    <option value="changes_requested">Ajuste solicitado</option>
                    <option value="recorded">Gravado</option>
                  </select>
                </Field>

                <Field label="Gancho" error={errors.hook?.message}>
                  {lockedFields['hook'] && lockedFields['hook'].userEmail !== onlineUsers.find(u => u.email === lockedFields['hook'].userEmail)?.email ? (
                    <div className="mb-2 text-[10px] text-dbe-blue bg-dbe-blue/10 border border-dbe-blue/20 rounded px-2 py-1 inline-block">
                      {lockedFields['hook'].userEmail} está editando...
                    </div>
                  ) : null}
                  <div onFocus={() => lockField('hook')} onBlur={() => unlockField('hook')}>
                    <Controller
                      control={control}
                      name="hook"
                      render={({ field }) => (
                        <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="A primeira frase que para o scroll..." minHeight={88} disabled={!!lockedFields['hook']} />
                      )}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <FieldHint text="Um bom gancho tem menos de 3 segundos e gera curiosidade imediata." value={watchedHook} />
                    <button
                      type="button"
                      onClick={handleSuggestHook}
                      disabled={hookSuggestionsLoading || !stripHtml(watchedHook).trim()}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-dbe-blue transition-colors hover:bg-dbe-blue/10 disabled:opacity-40"
                    >
                      <Sparkles className="h-3 w-3" />
                      {hookSuggestionsLoading ? 'Gerando...' : 'Sugestões Deby'}
                    </button>
                  </div>

                  {/* Hook suggestions panel */}
                  {showHookSuggestions && (
                    <div className="mt-2 rounded-lg border border-dbe-blue/20 bg-dbe-blue/5 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-dbe-blue">Sugestões de gancho da Deby</p>
                        <button type="button" onClick={() => setShowHookSuggestions(false)} className="text-dbe-muted hover:text-dbe-text">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {hookSuggestionsLoading && <p className="text-xs text-dbe-muted">Gerando sugestões...</p>}
                      {hookSuggestionsError && <p className="text-xs text-dbe-red">{hookSuggestionsError}</p>}
                      {hookSuggestions.map((hook, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setValue('hook', hook, { shouldDirty: true, shouldValidate: true }); setShowHookSuggestions(false) }}
                          className="mb-1.5 block w-full rounded-md border border-dbe-border/50 bg-black/20 px-3 py-2 text-left text-xs text-dbe-text transition-colors hover:border-dbe-blue/40 hover:bg-dbe-blue/5"
                        >
                          {hook}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>

                <Field label="Desenvolvimento" error={errors.body?.message}>
                  {lockedFields['body'] ? (
                    <div className="mb-2 text-[10px] text-dbe-blue bg-dbe-blue/10 border border-dbe-blue/20 rounded px-2 py-1 inline-block">
                      {lockedFields['body'].userEmail} está editando...
                    </div>
                  ) : null}
                  <div onFocus={() => lockField('body')} onBlur={() => unlockField('body')}>
                    <Controller
                      control={control}
                      name="body"
                      render={({ field }) => (
                        <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="Contexto, promessa, prova e argumento central..." minHeight={180} disabled={!!lockedFields['body']} />
                      )}
                    />
                  </div>
                  <FieldHint text="Apresente prova e contexto. Mantenha conciso para Reels." value={watchedBody} />
                  <div className="mt-1.5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleReviewBody}
                      disabled={bodySuggestionsLoading || !stripHtml(watchedBody).trim()}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-dbe-green transition-colors hover:bg-dbe-green/10 disabled:opacity-40"
                    >
                      <Sparkles className="h-3 w-3" />
                      {bodySuggestionsLoading ? 'Revisando...' : 'Deby AI revisar'}
                    </button>
                  </div>

                  {/* Body review panel */}
                  {showBodySuggestions && (
                    <div className="mt-2 rounded-lg border border-dbe-green/20 bg-dbe-green/5 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-dbe-green">Deby AI: Sugestões para o Desenvolvimento</p>
                        <button type="button" onClick={() => setShowBodySuggestions(false)} className="text-dbe-muted hover:text-dbe-text">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {bodySuggestionsLoading && <p className="text-xs text-dbe-muted">Revisando o desenvolvimento...</p>}
                      {bodySuggestionsError && <p className="text-xs text-dbe-red">{bodySuggestionsError}</p>}
                      {bodySuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setValue('body', suggestion, { shouldDirty: true, shouldValidate: true }); setShowBodySuggestions(false) }}
                          className="mb-1.5 block w-full rounded-md border border-dbe-border/50 bg-black/20 px-3 py-2 text-left text-xs text-dbe-text transition-colors hover:border-dbe-green/40 hover:bg-dbe-green/5"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>

                <Field label="CTA" error={errors.cta?.message}>
                  {lockedFields['cta'] ? (
                    <div className="mb-2 text-[10px] text-dbe-blue bg-dbe-blue/10 border border-dbe-blue/20 rounded px-2 py-1 inline-block">
                      {lockedFields['cta'].userEmail} está editando...
                    </div>
                  ) : null}
                  <div onFocus={() => lockField('cta')} onBlur={() => unlockField('cta')}>
                    <Controller
                      control={control}
                      name="cta"
                      render={({ field }) => (
                        <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="Uma acao clara para o proximo passo..." minHeight={88} disabled={!!lockedFields['cta']} />
                      )}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <FieldHint text="Uma unica chamada para acao, clara e direta." value={watchedCta} />
                    <button
                      type="button"
                      onClick={handleOptimizeCta}
                      disabled={ctaOptimizationLoading || !stripHtml(watchedCta).trim()}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-dbe-green transition-colors hover:bg-dbe-green/10 disabled:opacity-40"
                    >
                      <Wand2 className="h-3 w-3" />
                      {ctaOptimizationLoading ? 'Otimizando...' : 'Otimizar CTA'}
                    </button>
                  </div>

                  {/* CTA optimization panel */}
                  {showCtaOptimization && (
                    <div className="mt-2 rounded-lg border border-dbe-green/20 bg-dbe-green/5 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-dbe-green">Deby AI: Sugestão de CTA</p>
                        <button type="button" onClick={() => setShowCtaOptimization(false)} className="text-dbe-muted hover:text-dbe-text">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {ctaOptimizationLoading && <p className="text-xs text-dbe-muted">Analisando seu CTA...</p>}
                      {ctaOptimizationError && <p className="text-xs text-dbe-red">{ctaOptimizationError}</p>}
                      {ctaOptimization && (
                        <>
                          <p className="mb-2 rounded-md border border-dbe-border/50 bg-black/20 px-3 py-2 text-xs text-dbe-text">{ctaOptimization.optimized_cta}</p>
                          {ctaOptimization.explanation && (
                            <p className="mb-2 text-xs text-dbe-muted">{ctaOptimization.explanation}</p>
                          )}
                          <Button
                            size="sm"
                            type="button"
                            className="bg-dbe-green/15 text-dbe-green hover:bg-dbe-green/25"
                            onClick={() => { setValue('cta', ctaOptimization.optimized_cta, { shouldDirty: true, shouldValidate: true }); setShowCtaOptimization(false) }}
                          >
                            Aplicar sugestão
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Field>

                {script?.id && onAnalyze && (
                  <div className="rounded-xl border border-dbe-purple/20 bg-dbe-purple/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dbe-purple/20 bg-dbe-purple/10">
                          <BrainCircuit className="h-4 w-4 text-dbe-purple" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dbe-text">Analisar roteiro completo</p>
                          <p className="mt-1 text-xs leading-relaxed text-dbe-muted">
                            {isDirty
                              ? 'Salve as alteracoes antes de pedir uma nova analise da Deby.'
                              : 'A Deby avalia retencao, riscos e melhorias sem bloquear sua escrita.'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="deby"
                        onClick={handleAnalyze}
                        loading={analyzing}
                        disabled={!canAnalyze}
                      >
                        <Sparkles className="h-4 w-4" />
                        Analisar com Deby
                      </Button>
                    </div>

                    {showDebyPanel && (
                      <div className="mt-4">
                        <DebyAnalysisResult
                          status={analysisStatus}
                          analysis={analysis}
                          errorMessage={analysisError?.message}
                          onRetry={canAnalyze ? handleAnalyze : undefined}
                          onApply={analysis ? applyDebySuggestions : undefined}
                        />
                      </div>
                    )}
                  </div>
                )}

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

function FieldHint({ text, value }: { text: string; value: string }) {
  const plainText = stripHtml(value)
  const words = plainText.trim().split(/\s+/).filter(Boolean).length
  const seconds = Math.round((words / 130) * 60)

  return (
    <div className="mt-2 flex flex-col gap-1 text-xs text-dbe-muted sm:flex-row sm:items-center sm:justify-between">
      <span>{words} palavras · ~{seconds}s</span>
      <span>{text}</span>
    </div>
  )
}
