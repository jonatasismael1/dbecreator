import type { ReactNode } from 'react'
import { BrainCircuit, CheckCircle2, Lightbulb, Target, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { MarketMapInsights } from '../types/market-map.types'

interface MarketInsightsCardProps {
  insights: MarketMapInsights
  generatedAt?: string | null
}

export function MarketInsightsCard({ insights, generatedAt }: MarketInsightsCardProps) {
  return (
    <Card className="mt-4 space-y-5 border-dbe-green/25 bg-dbe-green/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--r-lg)] border border-dbe-green/30 bg-dbe-green/10">
            <BrainCircuit className="h-5 w-5 text-dbe-green" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-dbe-text">Insights da Deby</h2>
            <p className="mt-1 text-xs leading-relaxed text-dbe-muted">{insights.positioning_summary}</p>
          </div>
        </div>
        {generatedAt && (
          <Badge variant="purple">{new Date(generatedAt).toLocaleString('pt-BR')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightList icon={<Target className="h-4 w-4 text-dbe-blue" />} title="Publico" items={insights.audience_insights} />
        <InsightList icon={<Lightbulb className="h-4 w-4 text-dbe-blue" />} title="Oportunidades" items={insights.content_opportunities} />
        <InsightList icon={<CheckCircle2 className="h-4 w-4 text-dbe-green" />} title="Pilares" items={insights.pillar_recommendations} />
        <InsightList icon={<TriangleAlert className="h-4 w-4 text-dbe-red" />} title="Riscos" items={insights.risks} />
      </div>

      <div className="rounded-[var(--r-lg)] border border-dbe-border bg-dbe-dark/40 p-4">
        <p className="mb-3 text-sm font-semibold text-dbe-text">Proximas acoes</p>
        <ul className="space-y-2 text-xs leading-relaxed text-dbe-muted">
          {fallbackList(insights.next_actions).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

function InsightList({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-dbe-border bg-dbe-dark/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-dbe-text">{title}</p>
      </div>
      <ul className="space-y-2 text-xs leading-relaxed text-dbe-muted">
        {fallbackList(items).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function fallbackList(items: string[]) {
  return items.length ? items : ['Não informado']
}
