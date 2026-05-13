import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Map, Users, AlertCircle, Swords, Star, Mic } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/loading-state'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { MarketInsightsCard } from '../components/market-insights-card'
import { useAnalyzeMarketMap, useMarketMap, useUpsertMarketMap } from '../hooks/use-market-map'
import type { Competitor, MarketMapInsights } from '../types/market-map.types'
import { cn } from '@/lib/utils/cn'

// ─── Schema por step ───────────────────────────────────────────────────────
const step1Schema = z.object({ niche: z.string().min(3, 'Nicho obrigatório') })
const step2Schema = z.object({ target_audience: z.string().min(10, 'Descreva o público com mais detalhes') })
const step3Schema = z.object({ main_pain: z.string().min(10, 'Descreva a dor principal') })
const step4Schema = z.object({ differentiators: z.string().min(10, 'Descreva seus diferenciais') })
const step5Schema = z.object({ tone_of_voice: z.string().min(3, 'Descreva o tom de voz') })

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>
type Step5 = z.infer<typeof step5Schema>

// ─── Step Config ────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Nicho', icon: Map, description: 'Qual é o seu mercado?' },
  { label: 'Público', icon: Users, description: 'Para quem você cria conteúdo?' },
  { label: 'Dor', icon: AlertCircle, description: 'Qual a maior dor do seu público?' },
  { label: 'Concorrentes', icon: Swords, description: 'Quem são seus concorrentes?' },
  { label: 'Diferenciais', icon: Star, description: 'O que te faz único?' },
  { label: 'Tom de voz', icon: Mic, description: 'Como você se comunica?' },
]

const INPUT_CLASS = 'w-full px-4 py-3 rounded-lg bg-dbe-dark border border-dbe-border text-dbe-text text-sm placeholder:text-dbe-muted/50 outline-none focus:border-dbe-blue/50 focus:ring-1 focus:ring-dbe-blue/20 transition-all'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

export function MarketMapPage() {
  const { workspaceId } = useWorkspaceContext()
  const { data: existing, isLoading } = useMarketMap(workspaceId)
  const upsert = useUpsertMarketMap(workspaceId)
  const analyzeMarketMap = useAnalyzeMarketMap(workspaceId)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generatedInsights, setGeneratedInsights] = useState<MarketMapInsights | null>(null)
  const [generatedInsightsAt, setGeneratedInsightsAt] = useState<string | null>(null)

  // Accumulated form state
  const [formData, setFormData] = useState({
    niche: '',
    target_audience: '',
    main_pain: '',
    competitors: [] as Competitor[],
    differentiators: '',
    tone_of_voice: '',
    is_complete: false,
  })

  // Competitor mini-state
  const [compName, setCompName] = useState('')
  const [compStrength, setCompStrength] = useState('')

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { niche: formData.niche } })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { target_audience: formData.target_audience } })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { main_pain: formData.main_pain } })
  const form4 = useForm<Step4>({ resolver: zodResolver(step4Schema), defaultValues: { differentiators: formData.differentiators } })
  const form5 = useForm<Step5>({ resolver: zodResolver(step5Schema), defaultValues: { tone_of_voice: formData.tone_of_voice } })
  const selectedTone = useWatch({ control: form5.control, name: 'tone_of_voice' })

  useEffect(() => {
    if (!existing) return

    const nextData = {
      niche: existing.niche ?? '',
      target_audience: existing.target_audience ?? '',
      main_pain: existing.main_pain ?? '',
      competitors: existing.competitors ?? [],
      differentiators: existing.differentiators ?? '',
      tone_of_voice: existing.tone_of_voice ?? '',
      is_complete: existing.is_complete,
    }

    // Existing data arrives asynchronously from Supabase; the wizard state must mirror it once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(nextData)
    setSaved(existing.is_complete)
    form1.reset({ niche: nextData.niche })
    form2.reset({ target_audience: nextData.target_audience })
    form3.reset({ main_pain: nextData.main_pain })
    form4.reset({ differentiators: nextData.differentiators })
    form5.reset({ tone_of_voice: nextData.tone_of_voice })
  }, [existing, form1, form2, form3, form4, form5])

  const addCompetitor = () => {
    if (!compName.trim()) return
    setFormData(prev => ({ ...prev, competitors: [...prev.competitors, { name: compName, strength: compStrength }] }))
    setCompName(''); setCompStrength('')
  }

  const removeCompetitor = (i: number) => {
    setFormData(prev => ({ ...prev, competitors: prev.competitors.filter((_, idx) => idx !== i) }))
  }

  const collectStepData = async () => {
    if (step === 3) return formData

    if (step === 0) {
      if (!(await form1.trigger())) return null
      return { ...formData, ...form1.getValues() }
    }
    if (step === 1) {
      if (!(await form2.trigger())) return null
      return { ...formData, ...form2.getValues() }
    }
    if (step === 2) {
      if (!(await form3.trigger())) return null
      return { ...formData, ...form3.getValues() }
    }
    if (step === 4) {
      if (!(await form4.trigger())) return null
      return { ...formData, ...form4.getValues() }
    }
    if (step === 5) {
      if (!(await form5.trigger())) return null
      return { ...formData, ...form5.getValues() }
    }

    return formData
  }

  const handleNext = async () => {
    const latestData = await collectStepData()
    if (!latestData) return

    setFormData(latestData)
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  const handleSave = async (complete = false) => {
    const latestData = await collectStepData()
    if (!latestData) return

    setSaving(true)
    try {
      const savedMap = await upsert.mutateAsync({ ...latestData, is_complete: complete || latestData.is_complete })
      setFormData({
        niche: savedMap.niche ?? '',
        target_audience: savedMap.target_audience ?? '',
        main_pain: savedMap.main_pain ?? '',
        competitors: savedMap.competitors ?? [],
        differentiators: savedMap.differentiators ?? '',
        tone_of_voice: savedMap.tone_of_voice ?? '',
        is_complete: savedMap.is_complete,
      })
      setSaved(true)
      if (savedMap.is_complete) {
        const insights = await analyzeMarketMap.mutateAsync()
        setGeneratedInsights(insights)
        setGeneratedInsightsAt(new Date().toISOString())
      }
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingState />

  const progress = ((step + 1) / STEPS.length) * 100
  const visibleInsights = generatedInsights ?? existing?.deby_insights
  const visibleInsightsAt = generatedInsights ? generatedInsightsAt : existing?.last_insights_at

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Mapa de Mercado"
        description="Define a base estratégica para todo o seu conteúdo."
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <button
                key={s.label}
                onClick={() => setStep(i)}
                className={cn(
                  'flex flex-col items-center gap-1 group',
                  i <= step ? 'opacity-100' : 'opacity-40'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all',
                  i < step ? 'bg-dbe-green/10 border-dbe-green' :
                  i === step ? 'bg-dbe-blue/10 border-dbe-blue' :
                  'bg-transparent border-dbe-border'
                )}>
                  {i < step
                    ? <Check className="h-4 w-4 text-dbe-green" />
                    : <Icon className={cn('h-4 w-4', i === step ? 'text-dbe-blue' : 'text-dbe-muted')} />
                  }
                </div>
                <span className="text-[10px] text-dbe-muted hidden sm:block">{s.label}</span>
              </button>
            )
          })}
        </div>
        <div className="h-1 rounded-full bg-dbe-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-dbe-blue to-dbe-purple"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="p-4 sm:p-5">
            <div className="mb-6">
              <p className="text-xs text-dbe-blue font-semibold uppercase tracking-wider mb-1">
                Passo {step + 1} de {STEPS.length}
              </p>
              <h2 className="text-xl font-bold text-dbe-text">{STEPS[step].label}</h2>
              <p className="text-sm text-dbe-muted mt-1">{STEPS[step].description}</p>
            </div>

            {/* Step 0: Niche */}
            {step === 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dbe-muted">Qual é o seu nicho de mercado?</label>
                <input
                  {...form1.register('niche')}
                  placeholder="Ex: Nutrição para mulheres 30-50 anos, Moda feminina plus size..."
                  className={INPUT_CLASS}
                />
                {form1.formState.errors.niche && (
                  <p className="text-xs text-dbe-red">{form1.formState.errors.niche.message}</p>
                )}
                <p className="text-xs text-dbe-muted">Seja específico. Nichos bem definidos convertem mais.</p>
              </div>
            )}

            {/* Step 1: Audience */}
            {step === 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dbe-muted">Descreva seu público-alvo ideal</label>
                <textarea
                  {...form2.register('target_audience')}
                  rows={4}
                  placeholder="Ex: Mulheres de 30 a 45 anos, que trabalham CLT, querem emagrecer de forma saudável, mas não têm tempo..."
                  className={TEXTAREA_CLASS}
                />
                {form2.formState.errors.target_audience && (
                  <p className="text-xs text-dbe-red">{form2.formState.errors.target_audience.message}</p>
                )}
                <p className="text-xs text-dbe-muted">Inclua: faixa etária, situação de vida, desejos e obstáculos.</p>
              </div>
            )}

            {/* Step 2: Pain */}
            {step === 2 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dbe-muted">Qual é a maior dor do seu público?</label>
                <textarea
                  {...form3.register('main_pain')}
                  rows={4}
                  placeholder="Ex: Elas tentam dietas e abandonam porque não veem resultado rápido. Sentem vergonha no espelho e têm medo de ir à praia..."
                  className={TEXTAREA_CLASS}
                />
                {form3.formState.errors.main_pain && (
                  <p className="text-xs text-dbe-red">{form3.formState.errors.main_pain.message}</p>
                )}
                <p className="text-xs text-dbe-muted">A dor é o gatilho que faz o conteúdo parar o scroll.</p>
              </div>
            )}

            {/* Step 3: Competitors */}
            {step === 3 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-dbe-muted">Adicione seus principais concorrentes</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={compName}
                    onChange={e => setCompName(e.target.value)}
                    placeholder="Nome do concorrente"
                    className={cn(INPUT_CLASS, 'flex-1')}
                  />
                  <input
                    value={compStrength}
                    onChange={e => setCompStrength(e.target.value)}
                    placeholder="Ponto forte deles"
                    className={cn(INPUT_CLASS, 'flex-1')}
                  />
                  <Button type="button" size="sm" onClick={addCompetitor} variant="secondary" className="h-11 w-full sm:h-8 sm:w-auto" aria-label="Adicionar concorrente">
                    +
                  </Button>
                </div>
                {formData.competitors.length > 0 && (
                  <div className="space-y-2">
                    {formData.competitors.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-dbe-dark border border-dbe-border px-4 py-2.5">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-dbe-text">{c.name}</p>
                          {c.strength && <p className="text-xs text-dbe-muted">{c.strength}</p>}
                        </div>
                        <button onClick={() => removeCompetitor(i)} className="text-dbe-muted hover:text-dbe-red transition-colors" aria-label="Remover concorrente">×</button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.competitors.length === 0 && (
                  <p className="text-xs text-dbe-muted">Opcional — pule se preferir.</p>
                )}
              </div>
            )}

            {/* Step 4: Differentiators */}
            {step === 4 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dbe-muted">Quais são seus principais diferenciais?</label>
                <textarea
                  {...form4.register('differentiators')}
                  rows={4}
                  placeholder="Ex: Método próprio de 21 dias, atendimento personalizado, resultados documentados de alunas reais..."
                  className={TEXTAREA_CLASS}
                />
                {form4.formState.errors.differentiators && (
                  <p className="text-xs text-dbe-red">{form4.formState.errors.differentiators.message}</p>
                )}
              </div>
            )}

            {/* Step 5: Tone of Voice */}
            {step === 5 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-dbe-muted">Como é o seu tom de voz?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Descontraído', 'Sério e técnico', 'Inspiracional', 'Provocativo', 'Educativo', 'Empático'].map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => form5.setValue('tone_of_voice', tone)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm text-left transition-all',
                        selectedTone === tone
                          ? 'border-dbe-blue/40 bg-dbe-blue/10 text-dbe-blue'
                          : 'border-dbe-border text-dbe-muted hover:text-dbe-text hover:bg-white/5'
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
                <input
                  {...form5.register('tone_of_voice')}
                  placeholder="Ou descreva o seu próprio tom..."
                  className={INPUT_CLASS}
                />
                {form5.formState.errors.tone_of_voice && (
                  <p className="text-xs text-dbe-red">{form5.formState.errors.tone_of_voice.message}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
              {step > 0 && (
                <Button variant="ghost" onClick={handleBack} className="w-full gap-1.5 sm:w-auto">
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
              )}
              <div className="hidden flex-1 sm:block" />
              <Button variant="secondary" onClick={() => handleSave(false)} loading={saving} className="w-full sm:w-auto">
                {saved ? <><Check className="h-4 w-4" /> Salvo</> : 'Salvar progresso'}
              </Button>
              {step < STEPS.length - 1 && (
                <Button onClick={handleNext} className="w-full sm:w-auto">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === STEPS.length - 1 && (
                <Button onClick={() => handleSave(true)} loading={saving || analyzeMarketMap.isPending} className="col-span-2 w-full sm:col-span-1 sm:w-auto">
                  <Check className="h-4 w-4" /> Finalizar mapa
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Completion Banner */}
      {saved && formData.is_complete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-dbe-green/10 border border-dbe-green/20 px-5 py-4 flex items-center gap-3"
        >
          <Check className="h-5 w-5 text-dbe-green" />
          <div>
            <p className="text-sm font-semibold text-dbe-green">Mapa de Mercado completo!</p>
            <p className="text-xs text-dbe-muted">A Deby vai usar essas informações para analisar seus roteiros.</p>
          </div>
        </motion.div>
      )}

      {visibleInsights && (
        <MarketInsightsCard insights={visibleInsights} generatedAt={visibleInsightsAt} />
      )}
    </div>
  )
}
