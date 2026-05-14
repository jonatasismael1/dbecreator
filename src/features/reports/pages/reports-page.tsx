import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart3, Bookmark, Camera as Instagram, Eye, Heart, MessageCircle, Plus, UserRound, Users } from 'lucide-react'
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
              <h4 className="mb-3 text-sm font-medium text-dbe-text">Posts recentes</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {latestInsights.media.map((post) => (
                  <div key={post.id} className="overflow-hidden rounded-lg border border-dbe-border bg-black/20">
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
                        <a href={post.permalink} target="_blank" rel="noreferrer" className="inline-flex text-xs text-dbe-blue hover:underline">
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
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-dbe-border bg-dbe-navy/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-dbe-muted">{icon} {label}</div>
      <div className="text-2xl font-bold text-dbe-text">{typeof value === 'number' ? value.toLocaleString() : '-'}</div>
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
