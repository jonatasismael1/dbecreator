import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart3, Bookmark, Camera as Instagram, Clock3, Eye, Gauge, Heart, MapPin, MessageCircle, Plus, UserRound, Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { MetricModal } from '../components/metric-modal'
import { useInstagramInsights } from '../hooks/use-instagram-insights'
import { useReports } from '../hooks/use-reports'
import type { InstagramInsightsResponse } from '@/features/integrations/types/integration.types'
import type { CreateMetricDTO, PerformanceMetric } from '../types/report.types'

export function ReportsPage() {
  const { workspaceId } = useWorkspaceContext()
  const { metrics, isLoading, refetch, createMetric, updateMetric, deleteMetric } = useReports()
  const instagramInsights = useInstagramInsights(workspaceId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<PerformanceMetric | null>(null)
  const [latestInsights, setLatestInsights] = useState<InstagramInsightsResponse | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false)

  const handleOpenModal = (metric?: PerformanceMetric) => {
    setEditingMetric(metric || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setEditingMetric(null)
    setIsModalOpen(false)
  }

  const handleSaveMetric = async (data: CreateMetricDTO) => {
    if (editingMetric) {
      await updateMetric.mutateAsync({ id: editingMetric.id, dto: data })
    } else {
      await createMetric.mutateAsync(data)
    }
    handleCloseModal()
  }

  const handleDeleteMetric = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir estas metricas?')) {
      await deleteMetric.mutateAsync(id)
    }
  }

  const handleOpenSync = async () => {
    try {
      const insights = await instagramInsights.mutateAsync()
      setLatestInsights(insights)
      setSelectedPostId(null)
      setIsInsightModalOpen(false)
      await refetch()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao buscar insights do Instagram. Verifique a conexao em Configuracoes.')
    }
  }

  const totals = useMemo(() => {
    return metrics.reduce((acc, curr) => ({
      views: acc.views + curr.views,
      likes: acc.likes + curr.likes,
      comments: acc.comments + curr.comments,
      shares: acc.shares + curr.shares,
      saves: acc.saves + curr.saves,
    }), { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 })
  }, [metrics])

  const selectedInsightPost = useMemo(() => {
    if (!latestInsights) return null
    return latestInsights.media.find((post) => post.id === selectedPostId) ?? latestInsights.media[0] ?? null
  }, [latestInsights, selectedPostId])

  const openInsightModal = (postId: string) => {
    setSelectedPostId(postId)
    setIsInsightModalOpen(true)
  }

  return (
    <div className="h-full">
      <PageHeader title="Relatorios de Performance" description="Acompanhe dados reais dos conteudos publicados.">
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <Button variant="secondary" onClick={handleOpenSync} loading={instagramInsights.isPending} className="w-full sm:w-auto">
            <Instagram className="h-4 w-4" />
            Atualizar insights
          </Button>
          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Manual
          </Button>
        </div>
      </PageHeader>

      {latestInsights && (
        <Card className="mb-6 border-dbe-border bg-dbe-navy/50 p-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {latestInsights.account.profile_picture_url ? (
                <img src={latestInsights.account.profile_picture_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                  <Instagram className="h-5 w-5 text-pink-300" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-dbe-text">@{latestInsights.account.username || latestInsights.integration.account_name || 'instagram'}</h3>
                <p className="text-xs text-dbe-muted">
                  {latestInsights.account.name || 'Perfil Instagram'} sincronizado em{' '}
                  {format(new Date(latestInsights.synced_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard icon={<Eye className="h-4 w-4" />} label="Views" value={latestInsights.metrics.media_views} />
            <SummaryCard icon={<Users className="h-4 w-4 text-blue-300" />} label="Alcance" value={latestInsights.metrics.media_viewers ?? latestInsights.metrics.reach ?? null} />
            <SummaryCard icon={<UserRound className="h-4 w-4 text-green-300" />} label="Seguidores" value={latestInsights.metrics.follower_count ?? latestInsights.account.followers_count ?? null} />
            <SummaryCard icon={<Instagram className="h-4 w-4 text-pink-400" />} label="Visitas" value={latestInsights.metrics.profile_views} />
          </div>
          {Object.keys(latestInsights.metric_errors).length > 0 && (
            <p className="mt-3 text-xs text-amber-300">
              Algumas metricas podem depender de permissao aprovada na Meta ou disponibilidade da Graph API.
            </p>
          )}
          {latestInsights.media.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-medium text-dbe-text">Posts recentes</h4>
                <span className="text-xs text-dbe-muted">Toque em um post para detalhes</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {latestInsights.media.map((post) => (
                  <div
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openInsightModal(post.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') openInsightModal(post.id)
                    }}
                    className="overflow-hidden rounded-lg border border-dbe-border bg-black/20 text-left transition-colors hover:border-dbe-blue/70"
                  >
                    <PostThumbnail post={post} />
                    <div className="space-y-3 p-3">
                      <div>
                        <p className="line-clamp-2 min-h-10 text-sm text-dbe-text">{post.caption || 'Publicacao Instagram'}</p>
                        <p className="mt-1 text-xs text-dbe-muted">
                          {post.media_type || 'MEDIA'}{post.timestamp ? ` - ${format(new Date(post.timestamp), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-dbe-muted">
                        <MiniMetric label="Views" value={post.insights.media_views} />
                        <MiniMetric label="Likes" value={post.insights.likes ?? post.like_count ?? null} />
                        <MiniMetric label="Com." value={post.insights.comments ?? post.comments_count ?? null} />
                        <MiniMetric label="Salvos" value={post.insights.saved} />
                        <MiniMetric label="Comp." value={post.insights.shares ?? null} />
                        <MiniMetric label="Inter." value={post.insights.total_interactions ?? null} />
                      </div>
                      {post.permalink && (
                        <a href={post.permalink} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex text-xs text-dbe-blue hover:underline">
                          Abrir no Instagram
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dbe-blue border-t-transparent" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center">
          <EmptyState
            icon={BarChart3}
            title="Nenhum dado registrado"
            description="Atualize os insights do Instagram ou registre metricas manualmente para acompanhar seu crescimento."
            action={{ label: 'Atualizar Instagram', onClick: handleOpenSync }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            <SummaryCard icon={<Eye className="h-4 w-4" />} label="Views" value={totals.views} />
            <SummaryCard icon={<Heart className="h-4 w-4 text-red-400" />} label="Curtidas" value={totals.likes} />
            <SummaryCard icon={<MessageCircle className="h-4 w-4 text-blue-400" />} label="Comentarios" value={totals.comments} />
            <SummaryCard icon={<Instagram className="h-4 w-4 text-green-400" />} label="Compart." value={totals.shares} />
            <SummaryCard icon={<Bookmark className="h-4 w-4 text-amber-400" />} label="Salvos" value={totals.saves} />
          </div>

          <Card className="overflow-hidden border border-dbe-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-dbe-border bg-black/20 text-xs uppercase text-dbe-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Conteudo</th>
                    <th className="px-4 py-3 font-medium">Plataforma</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 text-right font-medium">Views</th>
                    <th className="px-4 py-3 text-right font-medium">Engajamento</th>
                    <th className="px-4 py-3 text-right font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="border-b border-dbe-border/50 transition-colors hover:bg-white/5">
                      <td className="max-w-[280px] px-4 py-3 font-medium text-dbe-text">
                        <div className="flex items-center gap-3">
                          {metric.thumbnail_url && <img src={metric.thumbnail_url} alt="" className="h-10 w-10 rounded-md object-cover" />}
                          <div className="min-w-0">
                            <p className="truncate" title={metric.script?.title || metric.caption || undefined}>
                              {metric.script?.title || metric.caption || 'Publicacao Instagram'}
                            </p>
                            {metric.external_permalink && (
                              <a href={metric.external_permalink} target="_blank" rel="noreferrer" className="text-xs text-dbe-blue hover:underline">
                                Abrir post
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-dbe-muted">{metric.platform}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-dbe-muted">
                        {format(new Date(metric.published_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-dbe-text">{metric.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-dbe-muted">
                        <div className="flex justify-end gap-3">
                          <span title="Curtidas">Likes {metric.likes}</span>
                          <span title="Comentarios">Com. {metric.comments}</span>
                          <span title="Compartilhamentos">Comp. {metric.shares}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(metric)} className="h-8 px-2 text-dbe-blue hover:text-dbe-blue/80">Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMetric(metric.id)} className="h-8 px-2 text-dbe-red hover:text-dbe-red/80">Excluir</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <MetricModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMetric}
        metric={editingMetric}
        isLoading={createMetric.isPending || updateMetric.isPending}
      />

      {latestInsights && selectedInsightPost && (
        <InsightDetailsModal
          isOpen={isInsightModalOpen}
          onClose={() => setIsInsightModalOpen(false)}
          insights={latestInsights}
          post={selectedInsightPost}
        />
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: number | null; onClick?: () => void }) {
  const content = (
    <>
      <div className="mb-2 flex items-center gap-2 text-dbe-muted">{icon} {label}</div>
      <div className="text-2xl font-bold text-dbe-text">{typeof value === 'number' ? value.toLocaleString() : '-'}</div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="rounded-lg border border-dbe-border bg-dbe-navy/50 p-4 text-left transition-colors hover:border-dbe-blue/70">
        {content}
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-dbe-border bg-dbe-navy/50 p-4">
      {content}
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5">
      <p>{label}</p>
      <p className="mt-0.5 font-medium text-dbe-text">{typeof value === 'number' ? value.toLocaleString() : '-'}</p>
    </div>
  )
}

function PostThumbnail({ post }: { post: InstagramInsightsResponse['media'][number] }) {
  const image = getPostImage(post)
  if (!image) return null

  return <img src={image} alt="" className="h-36 w-full object-cover" />
}

function getPostImage(post: InstagramInsightsResponse['media'][number]) {
  return post.thumbnail_url || post.media_url || null
}

function InsightDetailsModal({ isOpen, onClose, insights, post }: { isOpen: boolean; onClose: () => void; insights: InstagramInsightsResponse; post: InstagramInsightsResponse['media'][number] }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-xl border border-dbe-border bg-dbe-navy p-4 shadow-2xl sm:max-w-4xl sm:rounded-xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <InsightDetailContent insights={insights} post={post} onClose={onClose} />
      </div>
    </div>
  )
}

function InsightDetailContent({ insights, post, onClose }: { insights: InstagramInsightsResponse; post: InstagramInsightsResponse['media'][number]; onClose: () => void }) {
  const audience = insights.audience
  const engagementBase = post.insights.media_views ?? insights.metrics.media_views
  const interactionRate = engagementBase
    ? Math.round(((post.insights.total_interactions ?? 0) / engagementBase) * 1000) / 10
    : null

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-medium text-dbe-text">Detalhes do post</h4>
          <p className="mt-1 line-clamp-2 text-xs text-dbe-muted">{post.caption || 'Publicacao Instagram'}</p>
          {post.timestamp && <span className="mt-1 block text-xs text-dbe-muted">{format(new Date(post.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>}
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 shrink-0 rounded-md border border-dbe-border text-dbe-muted transition-colors hover:border-dbe-blue hover:text-dbe-text">×</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 md:grid-cols-2">
          <DetailGroup title="Performance" icon={<BarChart3 className="h-4 w-4 text-dbe-blue" />}>
            <DetailMetric label="Views" value={post.insights.media_views ?? insights.metrics.media_views} />
            <DetailMetric label="Alcance" value={post.insights.media_viewers ?? post.insights.reach ?? insights.metrics.media_viewers ?? insights.metrics.reach ?? null} />
            <DetailMetric label="Interacoes" value={post.insights.total_interactions ?? null} />
            <DetailMetric label="Taxa de interacao" value={interactionRate} suffix="%" />
          </DetailGroup>

          <DetailGroup title="Engajamento" icon={<Heart className="h-4 w-4 text-red-300" />}>
            <DetailMetric label="Curtidas" value={post.insights.likes ?? post.like_count ?? null} />
            <DetailMetric label="Comentarios" value={post.insights.comments ?? post.comments_count ?? null} />
            <DetailMetric label="Salvamentos" value={post.insights.saved ?? null} />
            <DetailMetric label="Compartilhamentos" value={post.insights.shares ?? null} />
          </DetailGroup>

          <DetailGroup title="Atividade no perfil" icon={<UserRound className="h-4 w-4 text-green-300" />}>
            <DetailMetric label="Novos seguidores" value={post.insights.follows ?? null} />
            <DetailMetric label="Visitas ao perfil" value={post.insights.profile_visits ?? insights.metrics.profile_views} />
            <DetailMetric label="Acoes no perfil" value={post.insights.profile_activity ?? null} />
            <DetailMetric label="Seguidores atuais" value={insights.metrics.follower_count ?? insights.account.followers_count ?? null} />
          </DetailGroup>

          <DetailGroup title="Retencao" icon={<Clock3 className="h-4 w-4 text-amber-300" />}>
            <UnavailableMetric label="Tempo medio assistido" />
            <UnavailableMetric label="Taxa de reels pulados" />
            <UnavailableMetric label="Retencao por segundo" />
            <UnavailableMetric label="Replays" />
          </DetailGroup>
        </div>

        <div className="grid gap-3">
          <DetailGroup title="Distribuicao" icon={<Gauge className="h-4 w-4 text-purple-300" />}>
            <UnavailableMetric label="Seguidores x nao seguidores" />
            <UnavailableMetric label="Principais fontes" />
            <UnavailableMetric label="Quando curtiram" />
          </DetailGroup>

          <DetailGroup title="Publico" icon={<MapPin className="h-4 w-4 text-pink-300" />}>
            <AudienceRows title="Paises" values={audience?.countries} />
            <AudienceRows title="Cidades" values={audience?.cities} />
            <AudienceRows title="Genero/idade" values={audience?.gender_age} />
            <AudienceRows title="Horarios ativos" values={audience?.online_followers} />
          </DetailGroup>

          {Object.keys(post.insight_errors).length > 0 && (
            <div className="rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
              {Object.keys(post.insight_errors).length} metricas nao foram retornadas pela API para este post.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailGroup({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-md border border-dbe-border/70 bg-dbe-navy/40 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-dbe-text">{icon}{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">{children}</div>
    </div>
  )
}

function DetailMetric({ label, value, suffix = '' }: { label: string; value: number | null | undefined; suffix?: string }) {
  return (
    <div className="rounded bg-white/[0.03] p-2">
      <p className="text-dbe-muted">{label}</p>
      <p className="mt-1 font-medium text-dbe-text">{typeof value === 'number' ? `${value.toLocaleString()}${suffix}` : 'Indisponivel'}</p>
    </div>
  )
}

function UnavailableMetric({ label }: { label: string }) {
  return (
    <div className="rounded bg-white/[0.03] p-2">
      <p className="text-dbe-muted">{label}</p>
      <p className="mt-1 font-medium text-dbe-muted">Nao exposto pela API</p>
    </div>
  )
}

function AudienceRows({ title, values }: { title: string; values?: Record<string, number> }) {
  const entries = Object.entries(values ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="col-span-2 rounded bg-white/[0.03] p-2">
      <p className="mb-1 text-dbe-muted">{title}</p>
      {entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-dbe-text">
              <span className="truncate">{label}</span>
              <span className="font-medium">{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-dbe-text">Indisponivel</p>
      )}
    </div>
  )
}
