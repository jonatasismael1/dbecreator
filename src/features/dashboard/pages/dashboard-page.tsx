import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lightbulb,
  Sparkles,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/context/auth-context'
import { useDebyHistory } from '@/features/deby/hooks/use-deby'
import { useIdeas } from '@/features/ideas/hooks/use-ideas'
import { useMarketMap } from '@/features/market-map/hooks/use-market-map'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useCampaigns } from '@/features/campaigns/hooks/use-campaigns'
import { useApprovals } from '@/features/approvals/hooks/use-approvals'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { PlatformGuide } from '@/features/onboarding/components/platform-guide'
import type { ScriptStatus } from '@/features/scripts/types/script.types'

const MOTIVATIONAL_QUOTES = [
  { quote: 'Criatividade é a inteligência se divertindo.', author: 'Albert Einstein' },
  { quote: 'A coragem não é a ausência do medo, mas o julgamento de que algo é mais importante que o medo.', author: 'Ambrose Redmoon' },
  { quote: 'O único modo de fazer um excelente trabalho é amar o que você faz.', author: 'Steve Jobs' },
  { quote: 'Não é o mais forte que sobrevive, nem o mais inteligente, mas o que melhor se adapta à mudança.', author: 'Charles Darwin' },
  { quote: 'A imaginação é mais importante que o conhecimento.', author: 'Albert Einstein' },
  { quote: 'Empreender é saltar de um penhasco e montar o avião na queda.', author: 'Reid Hoffman' },
  { quote: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
  { quote: 'A persistência é o caminho do êxito.', author: 'Charles Chaplin' },
  { quote: 'A vida não é o que acontece com você, mas como você reage ao que acontece.', author: 'Epicteto' },
  { quote: 'Caia sete vezes, levante-se oito.', author: 'Provérbio japonês' },
  { quote: 'Para ter um negócio de sucesso, alguém sempre teve que tomar uma decisão corajosa.', author: 'Peter Drucker' },
  { quote: 'O único lugar onde o sucesso vem antes do trabalho é no dicionário.', author: 'Vidal Sassoon' },
  { quote: 'Não espere. Nunca haverá um momento perfeito.', author: 'Napoleon Hill' },
  { quote: 'Uma ideia sem execução é apenas uma ilusão.', author: 'Thomas Edison' },
  { quote: 'Se você pode sonhar, você pode fazer.', author: 'Walt Disney' },
  { quote: 'O futuro pertence àqueles que acreditam na beleza dos seus sonhos.', author: 'Eleanor Roosevelt' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspaceId } = useWorkspaceContext()
  const { data: ideas = [], isLoading: ideasLoading } = useIdeas(workspaceId)
  const { data: scripts = [], isLoading: scriptsLoading } = useScripts(workspaceId)
  const { campaigns, isLoading: campaignsLoading } = useCampaigns()
  const { approvals, isLoading: approvalsLoading } = useApprovals()
  const profileQuery = useQuery({
    queryKey: ['profile-onboarding', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
  const { data: analyses = [], isLoading: analysesLoading } = useDebyHistory(workspaceId)
  const { data: marketMap, isLoading: marketMapLoading } = useMarketMap(workspaceId)
  const { data: pillars = [], isLoading: pillarsLoading } = usePillars(workspaceId)

  const randomQuote = useMemo(() => {
    const seed = new Date().getDate() + new Date().getMonth() * 31
    return MOTIVATIONAL_QUOTES[seed % MOTIVATIONAL_QUOTES.length]
  }, [])

  const isLoading = ideasLoading || scriptsLoading || campaignsLoading || approvalsLoading || analysesLoading || marketMapLoading || pillarsLoading
  const recentScripts = scripts.slice(0, 4)
  const setupSteps = [
    {
      label: 'Mapa de Mercado',
      description: 'Defina nicho, publico, dor, concorrentes, diferenciais e tom de voz.',
      path: '/market-map',
      cta: 'Montar mapa',
      done: !!marketMap?.is_complete,
    },
    {
      label: 'Pilares de Conteudo',
      description: 'Transforme o posicionamento em categorias editoriais com funcao comercial.',
      path: '/pillars',
      cta: 'Criar pilares',
      done: pillars.length > 0,
    },
    {
      label: 'Primeiro roteiro',
      description: 'Crie um roteiro com gancho, desenvolvimento, CTA e pilar vinculado.',
      path: '/scripts',
      cta: 'Criar roteiro',
      done: scripts.length > 0,
    },
    {
      label: 'Analise Deby AI',
      description: 'Use a Deby para criticar conversao, clareza da dor e proximo passo.',
      path: '/deby',
      cta: 'Analisar roteiro',
      done: analyses.length > 0,
    },
    {
      label: 'Calendario e aprovacao',
      description: 'Agende a publicacao e gere links para revisao externa quando precisar.',
      path: '/calendar',
      cta: 'Organizar calendario',
      done: campaigns.length > 0 || approvals.length > 0,
    },
  ]
  const progress = Math.round((setupSteps.filter((step) => step.done).length / setupSteps.length) * 100)

  const displayName = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ')[0]
    : user?.email?.split('@')[0] ?? 'Criador'

  if (isLoading) return <LoadingState />

  return (
    <div>
      {/* Personalized Greeting */}
      <div className="relative mb-6 overflow-hidden rounded-[var(--r-xl)] border border-border bg-gradient-to-br from-primary/10 via-surface to-success/8 px-6 py-5">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 right-16 h-16 w-16 rounded-full bg-success/12 blur-xl" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted mb-1">
            {getGreeting()}
          </p>
          <h2 className="text-2xl font-bold text-text tracking-tight mb-3">
            {displayName} 👋
          </h2>
          <div className="flex items-start gap-2.5 max-w-xl">
            <span className="mt-0.5 text-xl leading-none text-primary/60 font-serif select-none">"</span>
            <div>
              <p className="text-[13px] leading-relaxed text-text-muted italic">{randomQuote.quote}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-text-subtle">— {randomQuote.author}</p>
            </div>
          </div>
        </div>
      </div>

      <PageHeader title="Dashboard" description="Visão geral do seu workspace de conteúdo.">
        <Button variant="deby" size="sm" onClick={() => navigate('/deby')}>
          <Sparkles className="h-4 w-4" />
          Analisar com Deby AI
        </Button>
      </PageHeader>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ideias" value={ideas.length} icon={Lightbulb} accent="primary" onClick={() => navigate('/ideas')} />
        <StatCard title="Roteiros" value={scripts.length} icon={FileText} accent="primary" onClick={() => navigate('/scripts')} />
        <StatCard
          title="Campanhas"
          value={campaigns.length}
          icon={Zap}
          accent="success"
          onClick={() => navigate('/campaigns')}
        />
        <StatCard
          title="Aprovações"
          value={approvals.filter(a => a.status === 'pending').length}
          icon={CalendarDays}
          accent="success"
          onClick={() => navigate('/approvals')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Roteiros recentes</CardTitle>
              <Badge variant="blue">{scripts.length} roteiros</Badge>
            </CardHeader>
            {recentScripts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhum roteiro criado"
                description="Crie seu primeiro roteiro para a Deby AI analisar e transformar em conteúdo de alta conversão."
                action={{ label: 'Criar roteiro', onClick: () => navigate('/scripts') }}
              />
            ) : (
              <div className="space-y-2">
                {recentScripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => navigate(`/scripts/${script.id}`)}
                    className="flex w-full min-w-0 items-center justify-between gap-4 rounded-[var(--r-md)] border border-border bg-surface2/40 px-4 py-3.5 text-left transition-all hover:border-primary/25 hover:bg-surface2 max-sm:flex-col max-sm:items-start"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{script.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{script.campaigns?.title || script.hook}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full">
                      {script.last_analysis_score !== null && <Badge variant="blue">{formatScore(script.last_analysis_score)}</Badge>}
                      <Badge variant={script.status === 'recorded' || script.status === 'approved' ? 'success' : script.status === 'ready' || script.status === 'in_approval' ? 'blue' : 'default'}>
                        {getScriptStatusLabel(script.status)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fila de ideias</CardTitle>
              <Badge variant="default">{ideas.length} ideias</Badge>
            </CardHeader>
            {ideas.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="Sua central de ideias está vazia"
                description="Capture insights, referências e ideias que podem virar roteiros poderosos."
                action={{ label: 'Adicionar ideia', onClick: () => navigate('/ideas') }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ideas.slice(0, 4).map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => navigate('/ideas')}
                    className="rounded-[var(--r-md)] border border-border bg-surface2/40 px-4 py-3.5 text-left transition-all hover:border-primary/25 hover:bg-surface2"
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-text">{idea.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{idea.description ?? 'Sem descrição'}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {profileQuery.data?.onboarding_completed === false && (
            <PlatformGuide steps={setupSteps} progress={progress} onNavigate={navigate} />
          )}

          <Card>
            <CardTitle className="mb-4">Ações rápidas</CardTitle>
            <div className="space-y-1">
              {[
                { icon: Lightbulb, label: 'Nova ideia', iconClass: 'text-primary', path: '/ideas' },
                { icon: FileText, label: 'Novo roteiro', iconClass: 'text-primary', path: '/scripts' },
                { icon: Sparkles, label: 'Análise Deby AI', iconClass: 'text-success', path: '/deby' },
                { icon: CalendarDays, label: 'Calendário', iconClass: 'text-success', path: '/calendar' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="group flex w-full min-w-0 items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-sm text-text-muted transition-all hover:bg-surface2 hover:text-text"
                >
                  <action.icon className={`h-4 w-4 shrink-0 ${action.iconClass}`} strokeWidth={2} />
                  <span className="truncate">{action.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Status do workspace</CardTitle>
            <div className="space-y-2.5">
              {setupSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.done ? 'bg-success/15' : 'bg-surface2'}`}>
                    {step.done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      : <div className="h-1.5 w-1.5 rounded-full bg-text-subtle" />
                    }
                  </div>
                  <span className={`text-sm ${step.done ? 'text-text' : 'text-text-muted'}`}>{step.label}</span>
                  {step.done && <Badge variant="success" className="ml-auto text-[10px]">Feito</Badge>}
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
                <span>Progresso</span>
                <span className="font-semibold text-text">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>

          <div className="relative overflow-hidden rounded-[var(--r-lg)] border border-success/20 bg-gradient-to-br from-success/10 via-surface to-primary/6 p-4">
            <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-success/15 blur-xl" />
            <div className="relative flex items-start gap-3">
              <div className="shrink-0 rounded-[var(--r-md)] border border-success/20 bg-success/10 p-2.5">
                <Zap className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-text">Dica da Deby AI</p>
                <p className="text-xs leading-relaxed text-text-muted">
                  {analyses.length === 0
                    ? 'Analise um roteiro pronto para descobrir onde ele perde conversão.'
                    : `Você tem ${approvals.filter((approval) => approval.status === 'pending').length} roteiro(s) aguardando aprovação.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatScore(score: number) {
  return score.toLocaleString('pt-BR', { minimumFractionDigits: score % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })
}

function getScriptStatusLabel(status: ScriptStatus) {
  const labels: Record<ScriptStatus, string> = {
    draft: 'Rascunho',
    ready: 'Pronto',
    in_approval: 'Enviado para aprovação',
    approved: 'Aprovado',
    changes_requested: 'Ajuste solicitado',
    recorded: 'Gravado',
  }

  return labels[status]
}
