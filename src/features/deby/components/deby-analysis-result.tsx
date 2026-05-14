import { AlertCircle, BrainCircuit, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AnalysisResultCard } from './analysis-result-card'
import type { AiAnalysis, DebyAnalysisStatus } from '../types/deby.types'

interface DebyAnalysisResultProps {
  status: DebyAnalysisStatus
  analysis?: AiAnalysis | null
  errorMessage?: string
  onRetry?: () => void
  onApply?: () => void
  applying?: boolean
  applied?: boolean
}

export function DebyAnalysisResult({
  status,
  analysis,
  errorMessage,
  onRetry,
  onApply,
  applying,
  applied,
}: DebyAnalysisResultProps) {
  if (status === 'loading') {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dbe-purple/20 bg-dbe-purple/10">
          <BrainCircuit className="h-6 w-6 animate-pulse text-dbe-purple" />
        </div>
        <div>
          <p className="text-sm font-semibold text-dbe-text">Analisando com a Deby...</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-dbe-muted">
            A Deby esta avaliando retencao, clareza, riscos e oportunidades de melhoria do roteiro.
          </p>
        </div>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dbe-red/20 bg-dbe-red/10">
          <AlertCircle className="h-6 w-6 text-dbe-red" />
        </div>
        <div>
          <p className="text-sm font-semibold text-dbe-text">Nao foi possivel analisar o roteiro.</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-dbe-muted">
            {errorMessage || 'Verifique sua conexao e tente novamente.'}
          </p>
        </div>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </Card>
    )
  }

  if (status === 'success' && analysis) {
    return (
      <AnalysisResultCard
        analysis={analysis}
        onApply={onApply}
        applying={applying}
        applied={applied}
      />
    )
  }

  return null
}
