import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCalendarItems } from '@/features/calendar/hooks/use-calendar-items'
import { useDebyHistory } from '@/features/deby/hooks/use-deby'
import { useIdeas } from '@/features/ideas/hooks/use-ideas'
import { useMarketMap } from '@/features/market-map/hooks/use-market-map'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'

export function DashboardPage() {
  const navigate = useNavigate()
  const { workspaceId } = useWorkspaceContext()
  const { data: ideas = [], isLoading: ideasLoading } = useIdeas(workspaceId)
  const { data: scripts = [], isLoading: scriptsLoading } = useScripts(workspaceId)
  const { data: calendarItems = [], isLoading: calendarLoading } = useCalendarItems(workspaceId)
  const { data: analyses = [], isLoading: analysesLoading } = useDebyHistory(workspaceId)
  const { data: marketMap, isLoading: marketMapLoading } = useMarketMap(workspaceId)
  const { data: pillars = [], isLoading: pillarsLoading } = usePillars(workspaceId)

  const isLoading = ideasLoading || scriptsLoading || calendarLoading || analysesLoading || marketMapLoading || pillarsLoading
  const averageScore = analyses.length
    ? analyses.reduce((sum, analysis) => sum + analysis.result.score, 0) / analyses.length
    : null
  const recentScripts = scripts.slice(0, 4)
  const setupSteps = [
    { label: 'Mapa de Mercado', done: !!marketMap?.is_complete },
    { label: 'Pilares de Conteudo', done: pillars.length > 0 },
    { label: 'Primeiro Roteiro', done: scripts.length > 0 },
    { label: 'Analise Deby', done: analyses.length > 0 },
  ]
  const progress = Math.round((setupSteps.filter((step) => step.done).length / setupSteps.length) * 100)

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Dashboard" description="Visao geral do seu workspace de conteudo.">
        <Button variant="deby" size="sm" onClick={() => navigate('/deby')}>
          <Sparkles className="h-4 w-4" />
          Analisar com Deby
        </Button>
      </PageHeader>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ideias" value={ideas.length} icon={Lightbulb} accent="amber" />
        <StatCard title="Roteiros" value={scripts.length} icon={FileText} accent="blue" />
        <StatCard title="Agendados" value={calendarItems.length} icon={CalendarDays} accent="green" />
        <StatCard
          title="Score Medio"
          value={averageScore === null ? '-' : formatScore(averageScore)}
          icon={TrendingUp}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Roteiros Recentes</CardTitle>
              <Badge variant="blue">{scripts.length} roteiros</Badge>
            </CardHeader>
            {recentScripts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhum roteiro criado"
                description="Crie seu primeiro roteiro para a Deby analisar e transformar em conteudo de alta conversao."
                action={{ label: 'Criar Roteiro', onClick: () => navigate('/scripts') }}
              />
            ) : (
              <div className="space-y-3">
                {recentScripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => navigate('/scripts')}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-dbe-border bg-dbe-dark/50 p-4 text-left transition-all hover:border-dbe-blue/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-dbe-text">{script.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-dbe-muted">{script.hook}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {script.last_analysis_score !== null && <Badge variant="purple">{formatScore(script.last_analysis_score)}</Badge>}
                      <Badge variant={script.status === 'recorded' ? 'success' : script.status === 'ready' ? 'blue' : 'default'}>
                        {script.status === 'recorded' ? 'Gravado' : script.status === 'ready' ? 'Pronto' : 'Rascunho'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fila de Ideias</CardTitle>
              <Badge variant="default">{ideas.length} ideias</Badge>
            </CardHeader>
            {ideas.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="Sua central de ideias esta vazia"
                description="Capture insights, referencias e ideias que podem virar roteiros poderosos."
                action={{ label: 'Adicionar Ideia', onClick: () => navigate('/ideas') }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ideas.slice(0, 4).map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => navigate('/ideas')}
                    className="rounded-xl border border-dbe-border bg-dbe-dark/50 p-4 text-left transition-all hover:border-dbe-amber/40"
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-dbe-text">{idea.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-dbe-muted">{idea.description ?? 'Sem descricao'}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">Acoes Rapidas</CardTitle>
            <div className="space-y-2">
              {[
                { icon: Lightbulb, label: 'Nova Ideia', color: 'text-dbe-amber', path: '/ideas' },
                { icon: FileText, label: 'Novo Roteiro', color: 'text-dbe-blue', path: '/scripts' },
                { icon: Sparkles, label: 'Analise Deby', color: 'text-dbe-purple', path: '/deby' },
                { icon: CalendarDays, label: 'Calendario', color: 'text-dbe-green', path: '/calendar' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dbe-muted transition-all hover:bg-white/5 hover:text-dbe-text"
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <span>{action.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Status do Workspace</CardTitle>
            <div className="space-y-3">
              {setupSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full ${step.done ? 'bg-dbe-green/15' : 'bg-dbe-border'}`}>
                    {step.done && <CheckCircle2 className="h-3.5 w-3.5 text-dbe-green" />}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-dbe-text' : 'text-dbe-muted'}`}>{step.label}</span>
                  {step.done && <Badge variant="success" className="ml-auto">Feito</Badge>}
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-dbe-border pt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-dbe-muted">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-dbe-border">
                <div className="h-full rounded-full bg-gradient-to-r from-dbe-blue to-dbe-purple transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </Card>

          <Card className="border-dbe-purple/20 bg-gradient-to-br from-dbe-purple/5 to-dbe-blue/5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl border border-dbe-purple/20 bg-dbe-purple/10 p-2.5">
                <Zap className="h-5 w-5 text-dbe-purple" />
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-dbe-text">Dica da Deby</p>
                <p className="text-xs leading-relaxed text-dbe-muted">
                  {analyses.length === 0
                    ? 'Analise um roteiro pronto para descobrir onde ele perde conversao.'
                    : 'Use os roteiros com maior score como padrao para os proximos conteudos.'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function formatScore(score: number) {
  return score.toLocaleString('pt-BR', { minimumFractionDigits: score % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })
}
