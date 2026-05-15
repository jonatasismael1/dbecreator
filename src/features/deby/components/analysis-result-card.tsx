import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AiAnalysis, DebyResult } from '../types/deby.types'

interface AnalysisResultCardProps {
  analysis: AiAnalysis
  onApply?: () => void
  applying?: boolean
  applied?: boolean
}

export function AnalysisResultCard({ analysis, onApply, applying, applied }: AnalysisResultCardProps) {
  const result = analysis.result

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-dbe-green" />
            <p className="min-w-0 break-words text-sm font-semibold text-dbe-text">{analysis.scripts?.title ?? 'Roteiro analisado'}</p>
          </div>
          <p className="mt-1 text-xs text-dbe-muted">
            {new Date(analysis.created_at).toLocaleString('pt-BR')} • {analysis.model}
          </p>
        </div>
        <ScoreBadge result={result} />
      </div>

      <div className="rounded-xl border border-dbe-border bg-dbe-dark/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dbe-muted">Diagnostico</p>
        <p className="text-sm leading-relaxed text-dbe-text">{result.diagnosis}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InsightList title="Forcas" icon={<CheckCircle2 className="h-4 w-4 text-dbe-green" />} items={result.strengths} />
        <InsightList title="Fraquezas" icon={<AlertTriangle className="h-4 w-4 text-warning" />} items={result.weaknesses} />
        <InsightList title="Ajustes" icon={<TrendingUp className="h-4 w-4 text-dbe-blue" />} items={result.suggestions} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SuggestionBlock title="Gancho melhorado" value={result.improved_hook} />
        <SuggestionBlock title="CTA melhorado" value={result.improved_cta} />
      </div>

      <SuggestionBlock title="Roteiro reescrito" value={result.rewritten_script} large />

      <div className="flex flex-wrap gap-2">
        <Badge variant="purple">
          <Target className="h-3 w-3" />
          {result.pillar_suggestion || 'Sem sugestao de pilar'}
        </Badge>
        <Badge variant="warning">Risco: {result.conversion_risk || 'Não informado'}</Badge>
        {result.alignment_warning && <Badge variant="error">{result.alignment_warning}</Badge>}
      </div>

      {onApply && (
        <div className="flex flex-col gap-3 rounded-[var(--r-lg)] border border-dbe-green/30 bg-dbe-green/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-dbe-text">Aplicar melhorias no roteiro</p>
            <p className="mt-1 text-xs text-dbe-muted">
              Atualiza gancho, desenvolvimento e CTA com a versao reescrita pela Deby.
            </p>
          </div>
          <Button variant={applied ? 'secondary' : 'deby'} onClick={onApply} loading={applying} disabled={applied}>
            <RefreshCw className="h-4 w-4" />
            {applied ? 'Roteiro atualizado' : 'Atualizar roteiro'}
          </Button>
        </div>
      )}
    </Card>
  )
}

function ScoreBadge({ result }: { result: DebyResult }) {
  const variant = result.score >= 7.5 ? 'success' : result.score >= 6 ? 'blue' : result.score >= 4 ? 'warning' : 'error'

  return (
    <div className="flex items-center gap-3 rounded-[var(--r-lg)] border border-dbe-border bg-dbe-dark px-4 py-3">
      <div>
        <p className="text-xs text-dbe-muted">Score Deby</p>
        <p className="text-2xl font-bold text-dbe-text">{formatScore(result.score)}</p>
      </div>
      <Badge variant={variant}>{result.classification}</Badge>
    </div>
  )
}

function formatScore(score: number) {
  return score.toLocaleString('pt-BR', { minimumFractionDigits: score % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })
}

function InsightList({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-dbe-border bg-dbe-dark/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-dbe-text">{title}</p>
      </div>
      <ul className="space-y-2 text-xs leading-relaxed text-dbe-muted">
        {(items.length ? items : ['Não informado']).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function SuggestionBlock({ title, value, large }: { title: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-dbe-border bg-dbe-dark/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dbe-muted">{title}</p>
      <p className={large ? 'whitespace-pre-wrap break-words text-sm leading-relaxed text-dbe-text' : 'break-words text-sm leading-relaxed text-dbe-text'}>
        {value || 'Não informado'}
      </p>
    </div>
  )
}
