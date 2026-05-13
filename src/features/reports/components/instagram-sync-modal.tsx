import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Camera as Instagram, Check, ExternalLink, Link as LinkIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useReports } from '../hooks/use-reports'
import type { InstagramMedia } from '../hooks/use-sync-instagram'

interface InstagramSyncModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  mediaList: InstagramMedia[]
}

export function InstagramSyncModal({ isOpen, onClose, workspaceId, mediaList }: InstagramSyncModalProps) {
  const { data: scripts = [] } = useScripts(workspaceId)
  const { updateMetric } = useReports()

  const initiallyLinked = useMemo(
    () => new Set(mediaList.filter((media) => media.script_id).map((media) => media.id)),
    [mediaList]
  )
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [linkedMediaIds, setLinkedMediaIds] = useState<Set<string>>(initiallyLinked)

  if (!isOpen) return null

  const readyScripts = scripts.filter((script) => script.status === 'ready' || script.status === 'recorded')

  const handleLink = async (media: InstagramMedia) => {
    if (!selectedScriptId) {
      alert('Selecione um roteiro para vincular.')
      return
    }

    try {
      await updateMetric.mutateAsync({
        id: media.metric_id,
        dto: {
          script_id: selectedScriptId,
          platform: 'instagram',
          views: media.metrics.views,
          likes: media.metrics.likes,
          comments: media.metrics.comments,
          shares: media.metrics.shares,
          saves: media.metrics.saves,
          retention_rate: media.metrics.retention_rate,
          link_clicks: 0,
          published_at: media.timestamp,
          watch_time_seconds: media.metrics.watch_time_seconds,
        },
      })

      setLinkedMediaIds((prev) => new Set(prev).add(media.id))
      setSelectedMediaId(null)
      setSelectedScriptId('')
    } catch {
      alert('Erro ao vincular metricas.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl border border-dbe-border bg-dbe-navy sm:max-h-[90vh] sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-dbe-border p-4">
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-[#bc1888]" />
            <div>
              <h2 className="text-lg font-semibold text-dbe-text">Publicacoes sincronizadas</h2>
              <p className="text-xs text-dbe-muted">Os dados reais ja foram salvos no relatorio deste workspace.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-dbe-muted transition-colors hover:text-dbe-text" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {mediaList.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-dbe-muted">Nenhuma publicacao encontrada no Instagram conectado.</p>
            </div>
          ) : (
            mediaList.map((media) => {
              const isLinked = linkedMediaIds.has(media.id)
              const isLinking = selectedMediaId === media.id

              return (
                <div key={media.id} className="flex flex-col gap-4 rounded-lg border border-dbe-border bg-dbe-dark p-4 sm:flex-row">
                  <div className="relative h-36 w-full flex-shrink-0 overflow-hidden rounded-lg bg-black/40 sm:h-32 sm:w-32">
                    {media.thumbnail_url || media.media_url ? (
                      <img src={media.thumbnail_url || media.media_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-dbe-muted">
                        Sem thumbnail
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="mb-2 line-clamp-2 text-sm font-medium text-dbe-text">
                      {media.caption || 'Sem legenda'}
                    </p>
                    <div className="mb-auto flex flex-wrap gap-3 text-xs text-dbe-muted">
                      <span>Views {media.metrics.views.toLocaleString()}</span>
                      <span>Curtidas {media.metrics.likes.toLocaleString()}</span>
                      <span>Comentarios {media.metrics.comments.toLocaleString()}</span>
                      <span>Compart. {media.metrics.shares.toLocaleString()}</span>
                      <span>Salvos {media.metrics.saves.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-dbe-muted/60">
                      <span>{format(new Date(media.timestamp), "dd/MM/yyyy 'as' HH:mm")}</span>
                      {media.permalink && (
                        <a href={media.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-dbe-blue hover:underline">
                          Abrir no Instagram <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center sm:min-w-56">
                    {isLinked ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-dbe-green/20 bg-dbe-green/10 px-4 py-2 text-dbe-green">
                        <Check className="h-4 w-4" /> Vinculado
                      </div>
                    ) : isLinking ? (
                      <div className="space-y-2">
                        <select
                          className="w-full rounded-lg border border-dbe-border bg-black/40 px-3 py-2 text-sm text-dbe-text"
                          value={selectedScriptId}
                          onChange={(event) => setSelectedScriptId(event.target.value)}
                        >
                          <option value="">Selecione o roteiro...</option>
                          {readyScripts.map((script) => (
                            <option key={script.id} value={script.id}>{script.title}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="flex-1" onClick={() => setSelectedMediaId(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" className="flex-1" onClick={() => handleLink(media)} loading={updateMetric.isPending}>
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="secondary" className="w-full" onClick={() => setSelectedMediaId(media.id)}>
                        <LinkIcon className="h-4 w-4" /> Vincular roteiro
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end border-t border-dbe-border bg-dbe-navy p-4">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
