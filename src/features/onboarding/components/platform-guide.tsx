import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PlatformGuideStep {
  label: string
  description: string
  path: string
  cta: string
  done: boolean
}

interface PlatformGuideProps {
  steps: PlatformGuideStep[]
  progress: number
  onNavigate: (path: string) => void
}

export function PlatformGuide({ steps, progress, onNavigate }: PlatformGuideProps) {
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1]

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/8 via-surface to-success/6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <CardTitle>Primeiros passos</CardTitle>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            Siga este fluxo para transformar estrategia em roteiro, calendario e performance.
          </p>
        </div>
        <Badge variant={progress === 100 ? 'success' : 'primary'}>{progress}%</Badge>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const Icon = step.done ? CheckCircle2 : Circle
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => onNavigate(step.path)}
              className="group flex w-full items-start gap-3 rounded-[var(--r-md)] border border-border/70 bg-black/10 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon className={step.done ? 'mt-0.5 h-4 w-4 shrink-0 text-success' : 'mt-0.5 h-4 w-4 shrink-0 text-text-muted'} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{step.description}</p>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )
        })}
      </div>

      {nextStep && progress < 100 && (
        <Button className="mt-4 w-full" onClick={() => onNavigate(nextStep.path)}>
          {nextStep.cta}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </Card>
  )
}
