import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart3, Bookmark, Camera as Instagram, Eye, Heart, MessageCircle, Plus, Share2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { InstagramSyncModal } from '../components/instagram-sync-modal'
import { MetricModal } from '../components/metric-modal'
import { useReports } from '../hooks/use-reports'
import { useSyncInstagram, type InstagramMedia } from '../hooks/use-sync-instagram'
import type { PerformanceMetric } from '../types/report.types'

export function ReportsPage() {
  const { workspaceId } = useWorkspaceContext()
  const { metrics, isLoading, refetch, createMetric, updateMetric, deleteMetric } = useReports()
  const syncInstagram = useSyncInstagram(workspaceId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<PerformanceMetric | null>(null)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<InstagramMedia[]>([])

  const handleOpenModal = (metric?: PerformanceMetric) => {
    setEditingMetric(metric || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setEditingMetric(null)
    setIsModalOpen(false)
  }

  const handleSaveMetric = async (data: any) => {
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
      const media = await syncInstagram.mutateAsync()
      setMediaList(media)
      setIsSyncModalOpen(true)
      await refetch()
    } catch (err: any) {
      alert(err.message || 'Erro ao sincronizar com o Instagram. Verifique a conexao em Configuracoes.')
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
          <Button variant="secondary" onClick={handleOpenSync} loading={syncInstagram.isPending} className="w-full sm:w-auto">
            <Instagram className="h-4 w-4" />
            Sincronizar
          </Button>
          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Manual
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dbe-blue border-t-transparent" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center">
          <EmptyState
            icon={BarChart3}
            title="Nenhum dado registrado"
            description="Sincronize seu Instagram ou registre metricas manualmente para acompanhar seu crescimento."
            action={{ label: 'Sincronizar Instagram', onClick: handleOpenSync }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            <SummaryCard icon={<Eye className="h-4 w-4" />} label="Views" value={totals.views} />
            <SummaryCard icon={<Heart className="h-4 w-4 text-red-400" />} label="Curtidas" value={totals.likes} />
            <SummaryCard icon={<MessageCircle className="h-4 w-4 text-blue-400" />} label="Comentarios" value={totals.comments} />
            <SummaryCard icon={<Share2 className="h-4 w-4 text-green-400" />} label="Compart." value={totals.shares} />
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

      <InstagramSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        workspaceId={workspaceId!}
        mediaList={mediaList}
      />
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <Card className="border-dbe-border bg-dbe-navy/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-dbe-muted">{icon} {label}</div>
      <div className="text-2xl font-bold text-dbe-text">{value.toLocaleString()}</div>
    </Card>
  )
}
