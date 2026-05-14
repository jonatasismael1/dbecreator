import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useMarketMapWizard, useUpsertMarketMap } from '@/features/market-map/hooks/use-market-map'
import type { Competitor, MarketMapWizardSuggestion } from '@/features/market-map/types/market-map.types'

interface OnboardingWizardProps {
  workspaceId: string
  userId: string
  onClose: () => void
  onComplete: () => void
}

const inputClass = 'w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none transition-all placeholder:text-dbe-muted/50 focus:border-dbe-blue/50'
const textareaClass = `${inputClass} min-h-24 resize-y`

export function OnboardingWizard({ workspaceId, userId, onClose, onComplete }: OnboardingWizardProps) {
  const upsert = useUpsertMarketMap(workspaceId)
  const wizard = useMarketMapWizard(workspaceId)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [niche, setNiche] = useState('')
  const [suggestions, setSuggestions] = useState<MarketMapWizardSuggestion>({
    target_audience: '',
    main_pain: '',
    competitors: [],
    differentiators: '',
    tone_of_voice: '',
  })

  const handleSkip = () => {
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem('dbe_onboarding_dismissed_until', String(tomorrow))
    onClose()
  }

  const handleGenerate = async () => {
    if (niche.trim().length < 3) {
      setError('Informe um nicho com pelo menos 3 caracteres.')
      return
    }

    setError('')
    const data = await wizard.mutateAsync(niche.trim())
    setSuggestions(data)
    setStep(2)
  }

  const handleSave = async () => {
    setError('')
    await upsert.mutateAsync({
      niche: niche.trim(),
      target_audience: suggestions.target_audience,
      main_pain: suggestions.main_pain,
      competitors: suggestions.competitors,
      differentiators: suggestions.differentiators,
      tone_of_voice: suggestions.tone_of_voice,
      is_complete: true,
    })

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)

    if (profileError) throw profileError
    localStorage.removeItem('dbe_onboarding_dismissed_until')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-0">
        <div className="flex items-start justify-between border-b border-dbe-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-dbe-purple">Primeira configuracao</p>
            <h2 className="mt-1 text-xl font-bold text-dbe-text">Mapa de Mercado com Deby</h2>
          </div>
          <button onClick={handleSkip} className="rounded-lg p-2 text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text" aria-label="Fechar onboarding">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {step === 1 ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-dbe-text">Qual e o seu nicho?</label>
              <input
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                className={inputClass}
                placeholder="Ex: dermatologista focado em rejuvenescimento natural"
              />
              <p className="text-xs leading-relaxed text-dbe-muted">
                A Deby usa esse ponto de partida para sugerir publico, dor principal, concorrentes, diferenciais e tom de voz.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <WizardTextarea label="Publico-alvo" value={suggestions.target_audience ?? ''} onChange={(value) => setSuggestions((prev) => ({ ...prev, target_audience: value }))} />
              <WizardTextarea label="Dor principal" value={suggestions.main_pain ?? ''} onChange={(value) => setSuggestions((prev) => ({ ...prev, main_pain: value }))} />
              <WizardTextarea label="Diferenciais" value={suggestions.differentiators ?? ''} onChange={(value) => setSuggestions((prev) => ({ ...prev, differentiators: value }))} />
              <WizardTextarea label="Tom de voz" value={suggestions.tone_of_voice ?? ''} onChange={(value) => setSuggestions((prev) => ({ ...prev, tone_of_voice: value }))} />
              <CompetitorEditor
                competitors={suggestions.competitors ?? []}
                onChange={(competitors) => setSuggestions((prev) => ({ ...prev, competitors }))}
              />
            </div>
          )}

          {error && <p className="rounded-lg border border-dbe-red/20 bg-dbe-red/10 p-3 text-xs text-dbe-red">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-dbe-border pt-4 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={handleSkip}>Fazer depois</Button>
            {step === 1 ? (
              <Button variant="deby" onClick={handleGenerate} loading={wizard.isPending}>
                <Sparkles className="h-4 w-4" />
                Preencher com Deby
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={handleSave} loading={upsert.isPending}>Salvar e comecar</Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function WizardTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-dbe-text">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={textareaClass} />
    </label>
  )
}

function CompetitorEditor({ competitors, onChange }: { competitors: Competitor[]; onChange: (value: Competitor[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-dbe-text">Concorrentes</p>
      <div className="space-y-2">
        {competitors.map((competitor, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={competitor.name}
              onChange={(event) => onChange(competitors.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
              className={inputClass}
              placeholder="Nome"
            />
            <input
              value={competitor.strength}
              onChange={(event) => onChange(competitors.map((item, itemIndex) => itemIndex === index ? { ...item, strength: event.target.value } : item))}
              className={inputClass}
              placeholder="Ponto forte"
            />
            <Button type="button" variant="ghost" onClick={() => onChange(competitors.filter((_, itemIndex) => itemIndex !== index))}>Remover</Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => onChange([...competitors, { name: '', strength: '' }])}>
        Adicionar concorrente
      </Button>
    </div>
  )
}
