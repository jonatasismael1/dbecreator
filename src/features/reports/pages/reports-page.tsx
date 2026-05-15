import { useMemo, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart3, Bookmark, Camera as Instagram, Eye, Heart, MapPin, MessageCircle, Plus, UserRound, Users, Download, Sparkles, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { MetricModal } from '../components/metric-modal'
import { useInstagramInsights } from '../hooks/use-instagram-insights'
import { useReports } from '../hooks/use-reports'
import { debyService } from '@/features/deby/services/deby.service'
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const { data: aiInsights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['report-insights', workspaceId],
    queryFn: () => debyService.getReportInsights(workspaceId),
    enabled: !!workspaceId,
  })

  const generateNewInsights = useMutation({
    mutationFn: () => debyService.generateReportInsights(workspaceId),
    onSuccess: () => refetchInsights(),
  })

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
    if (confirm('Tem certeza que deseja excluir estas métricas?')) {
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
      alert(err instanceof Error ? err.message : 'Erro ao buscar insights do Instagram. Verifique a conexão em Configurações.')
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

  const rankedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => metricEngagement(b) - metricEngagement(a))
  }, [metrics])

  const bestMetric = rankedMetrics[0] ?? null
  const averageViews = metrics.length ? Math.round(totals.views / metrics.length) : 0

  const selectedInsightPost = useMemo(() => {
    if (!latestInsights) return null
    return latestInsights.media.find((post) => post.id === selectedPostId) ?? latestInsights.media[0] ?? null
  }, [latestInsights, selectedPostId])

  const openInsightModal = (postId: string) => {
    setSelectedPostId(postId)
    setIsInsightModalOpen(true)
  }

  const handleExportPdf = async () => {
    if (!reportRef.current) return
    setIsGeneratingPdf(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Relatorio_DBE_${format(new Date(), 'dd-MM-yyyy')}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="h-full">
      <PageHeader title="Relatórios de performance">
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <Button variant="secondary" onClick={handleExportPdf} loading={isGeneratingPdf} className="w-full sm:w-auto">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button variant="secondary" onClick={handleOpenSync} loading={instagramInsights.isPending} className="w-full sm:w-auto">
            <Instagram className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar insights</span>
            <span className="sm:hidden">Sincronizar</span>
          </Button>
          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto col-span-2 sm:col-span-1">
            <Plus className="h-4 w-4" />
            Manual
          </Button>
        </div>
      </PageHeader>

      <div ref={reportRef} className="space-y-6 rounded-lg bg-background/40 p-1">
      {latestInsights && (
        <Card className="mb-6 overflow-hidden p-4">
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
                <h3 className="font-medium text-text">@{latestInsights.account.username || latestInsights.integration.account_name || 'instagram'}</h3>
                <p className="text-xs text-text-muted">
                  {latestInsights.account.name || 'Perfil Instagram'} sincronizado em{' '}
                  {format(new Date(latestInsights.synced_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <SummaryCard icon={<Eye className="h-4 w-4" />} label="Impressões" value={latestInsights.metrics.impressions} />
            <SummaryCard icon={<Eye className="h-4 w-4 text-purple-300" />} label="Views" value={latestInsights.metrics.media_views} />
            <SummaryCard icon={<Users className="h-4 w-4 text-blue-300" />} label="Alcance" value={latestInsights.metrics.media_viewers ?? latestInsights.metrics.reach ?? null} />
            <SummaryCard icon={<UserRound className="h-4 w-4 text-green-300" />} label="Seguidores" value={latestInsights.metrics.follower_count ?? latestInsights.account.followers_count ?? null} />
            <SummaryCard icon={<Instagram className="h-4 w-4 text-pink-400" />} label="Visitas" value={latestInsights.metrics.profile_views} />
            <SummaryCard icon={<Plus className="h-4 w-4 text-blue-400" />} label="Cliques Site" value={latestInsights.metrics.website_clicks} />
          </div>
          {latestInsights.media.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-text">Posts recentes</h4>
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
                    className="overflow-hidden rounded-lg border border-border bg-black/20 text-left transition-colors hover:border-primary/70"
                  >
                    <PostThumbnail post={post} />
                    <div className="space-y-3 p-3">
                      <div>
                        <p className="line-clamp-2 min-h-10 text-sm text-text">{post.caption || 'Publicação Instagram'}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {post.media_type || 'MEDIA'}{post.timestamp ? ` - ${format(new Date(post.timestamp), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-text-muted">
                        <MiniMetric label="Views" value={post.insights.media_views} />
                        <MiniMetric label="Likes" value={post.insights.likes ?? post.like_count ?? null} />
                        <MiniMetric label="Com." value={post.insights.comments ?? post.comments_count ?? null} />
                        <MiniMetric label="Salvos" value={post.insights.saved} />
                        <MiniMetric label="Comp." value={post.insights.shares ?? null} />
                        <MiniMetric label="Inter." value={post.insights.total_interactions ?? null} />
                      </div>
                      {post.permalink && (
                        <a href={post.permalink} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex text-xs text-primary hover:underline">
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
        <LoadingState />
      ) : metrics.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center">
          <EmptyState
            icon={BarChart3}
            title="Nenhum dado registrado"
            description="Sincronize o Instagram ou adicione um registro manual."
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

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <PerformanceSpotlight metric={bestMetric} />
            <Card className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-lg border border-border/70 bg-white/[0.03] p-3">
                <p className="text-xs text-text-muted">Média de views</p>
                <p className="mt-1 text-2xl font-bold text-text">{averageViews.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-white/[0.03] p-3">
                <p className="text-xs text-text-muted">Interações</p>
                <p className="mt-1 text-2xl font-bold text-text">{(totals.likes + totals.comments + totals.shares + totals.saves).toLocaleString()}</p>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden border border-ai/30 bg-gradient-to-br from-ai-soft via-surface to-primary-soft/40">
            <div className="flex items-center justify-between border-b border-ai/20 bg-ai/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai" />
                <h3 className="font-semibold text-ai">Insights Deby</h3>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 border-ai/30 text-ai hover:bg-ai/20"
                onClick={() => generateNewInsights.mutate()}
                loading={generateNewInsights.isPending}
              >
                Analisar Performance
              </Button>
            </div>
            <div className="p-5">
              {insightsLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando insights...
                </div>
              ) : aiInsights && aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map(insight => (
                    <div key={insight.id} className="rounded-lg border border-border/50 bg-black/20 p-4">
                      <p className="text-sm font-medium text-text">{insight.insight_text}</p>
                      <p className="mt-1 text-sm text-text-muted"><span className="font-semibold text-amber-400">Recomendação:</span> {insight.recommendation_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Gere uma leitura estratégica dos resultados.</p>
              )}
            </div>
          </Card>

          <div className="space-y-3 lg:hidden">
            {rankedMetrics.map((metric) => (
              <MetricMobileCard
                key={metric.id}
                metric={metric}
                onEdit={handleOpenModal}
                onDelete={handleDeleteMetric}
              />
            ))}
          </div>

          <Card className="hidden overflow-hidden border border-border lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-black/20 text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Conteúdo</th>
                    <th className="px-4 py-3 font-medium">Plataforma</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 text-right font-medium">Views</th>
                    <th className="px-4 py-3 text-right font-medium">Engajamento</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="border-b border-border/50 transition-colors hover:bg-white/5">
                      <td className="max-w-[280px] px-4 py-3 font-medium text-text">
                        <div className="flex items-center gap-3">
                          {metric.thumbnail_url && <img src={metric.thumbnail_url} alt="" className="h-10 w-10 rounded-md object-cover" />}
                          <div className="min-w-0">
                            <p className="truncate" title={metric.script?.title || metric.caption || undefined}>
                              {metric.script?.title || metric.caption || 'Publicação Instagram'}
                            </p>
                            {metric.external_permalink && (
                              <a href={metric.external_permalink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                Abrir post
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-text-muted">{metric.platform}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                        {format(new Date(metric.published_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text">{metric.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-text-muted">
                        <div className="flex justify-end gap-3">
                          <span title="Curtidas">Likes {metric.likes}</span>
                          <span title="Comentarios">Com. {metric.comments}</span>
                          <span title="Compartilhamentos">Comp. {metric.shares}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(metric)} className="h-8 px-2 text-primary hover:text-primary/80">Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMetric(metric.id)} className="h-8 px-2 text-danger hover:text-danger/80">Excluir</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      </div>

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

function PerformanceSpotlight({ metric }: { metric: PerformanceMetric | null }) {
  if (!metric) {
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold text-text">Destaque</p>
        <p className="mt-2 text-sm text-text-muted">Sem publicações analisadas.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
        {metric.thumbnail_url ? (
          <img src={metric.thumbnail_url} alt="" className="h-36 w-full object-cover sm:h-full" />
        ) : (
          <div className="flex min-h-32 items-center justify-center bg-gradient-to-br from-primary-soft to-ai-soft">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        )}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Destaque</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-text">
            {metric.script?.title || metric.caption || 'Publicação Instagram'}
          </h3>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <MiniMetric label="Views" value={metric.views} />
            <MiniMetric label="Eng." value={metricEngagement(metric)} />
            <MiniMetric label="Salvos" value={metric.saves} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function MetricMobileCard({ metric, onEdit, onDelete }: { metric: PerformanceMetric; onEdit: (metric: PerformanceMetric) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="p-3">
      <div className="flex gap-3">
        {metric.thumbnail_url && <img src={metric.thumbnail_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-sm font-semibold text-text">
            {metric.script?.title || metric.caption || 'Publicação Instagram'}
          </p>
          <p className="mt-1 text-xs capitalize text-text-muted">
            {metric.platform} · {format(new Date(metric.published_at), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
        <MiniMetric label="Views" value={metric.views} />
        <MiniMetric label="Likes" value={metric.likes} />
        <MiniMetric label="Com." value={metric.comments} />
        <MiniMetric label="Salvos" value={metric.saves} />
      </div>
      <div className="mt-3 flex justify-end gap-2 border-t border-border/60 pt-3">
        <Button variant="ghost" size="sm" onClick={() => onEdit(metric)} className="h-8 px-2 text-primary hover:text-primary/80">Editar</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(metric.id)} className="h-8 px-2 text-danger hover:text-danger/80">Excluir</Button>
      </div>
    </Card>
  )
}

function SummaryCard({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: number | null; onClick?: () => void }) {
  const content = (
    <>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-muted">{icon} {label}</div>
      <div className="text-2xl font-bold tracking-tight text-text">{typeof value === 'number' ? value.toLocaleString() : '-'}</div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="rounded-lg border border-border bg-white/[0.035] p-4 text-left transition-colors hover:border-primary/70">
        {content}
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-white/[0.035] p-4">
      {content}
    </div>
  )
}

function metricEngagement(metric: PerformanceMetric) {
  return metric.likes + metric.comments + metric.shares + metric.saves
}

function MiniMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5">
      <p className="text-text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-text">{typeof value === 'number' ? value.toLocaleString() : '-'}</p>
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
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-xl border border-border bg-surface p-4 shadow-2xl sm:max-w-4xl sm:rounded-xl sm:p-5"
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
          <h4 className="font-medium text-text">Detalhes do post</h4>
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">{post.caption || 'Publicação Instagram'}</p>
          {post.timestamp && <span className="mt-1 block text-xs text-text-muted">{format(new Date(post.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>}
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 shrink-0 rounded-md border border-border text-text-muted transition-colors hover:border-primary hover:text-text">×</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 md:grid-cols-2">
          <DetailGroup title="Performance" icon={<BarChart3 className="h-4 w-4 text-primary" />}>
            <DetailMetric label="Impressões" value={post.insights.impressions} />
            <DetailMetric label="Views" value={post.insights.media_views ?? insights.metrics.media_views} />
            <DetailMetric label="Alcance" value={post.insights.media_viewers ?? post.insights.reach ?? insights.metrics.media_viewers ?? insights.metrics.reach ?? null} />
            <DetailMetric label="Interações" value={post.insights.total_interactions ?? null} />
            <DetailMetric label="Taxa de interação" value={interactionRate} suffix="%" />
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
            <DetailMetric label="Ações no perfil" value={post.insights.profile_activity ?? null} />
            <DetailMetric label="Seguidores atuais" value={insights.metrics.follower_count ?? insights.account.followers_count ?? null} />
          </DetailGroup>

        </div>

        <div className="grid gap-3">
          <DetailGroup title="Público" icon={<MapPin className="h-4 w-4 text-pink-300" />}>
            <AudienceRows title="Países" values={audience?.countries} />
            <AudienceRows title="Cidades" values={audience?.cities} />
            <AudienceRows title="Gênero/idade" values={audience?.gender_age} />
            <AudienceRows title="Horários ativos" values={audience?.online_followers} />
          </DetailGroup>
        </div>
      </div>
    </div>
  )
}

function DetailGroup({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-md border border-border/70 bg-surface/40 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text">{icon}{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">{children}</div>
    </div>
  )
}

function DetailMetric({ label, value, suffix = '' }: { label: string; value: number | null | undefined; suffix?: string }) {
  return (
    <div className="rounded bg-white/[0.03] p-2">
      <p className="text-text-muted">{label}</p>
      <p className="mt-1 font-medium text-text">{typeof value === 'number' ? `${value.toLocaleString()}${suffix}` : 'Indisponível'}</p>
    </div>
  )
}

function AudienceRows({ title, values }: { title: string; values?: Record<string, number> }) {
  const entries = Object.entries(values ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="col-span-2 rounded bg-white/[0.03] p-2">
      <p className="mb-1 text-text-muted">{title}</p>
      {entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-text">
              <span className="truncate">{label}</span>
              <span className="font-medium">{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text">Indisponível</p>
      )}
    </div>
  )
}
