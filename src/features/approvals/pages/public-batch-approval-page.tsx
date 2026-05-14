import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, AlertTriangle, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function fetchBatch(token: string) {
  const res = await fetch(`/api/public-batch-approval?token=${token}`)
  if (!res.ok) throw new Error('Falha ao buscar lote')
  return res.json()
}

export function PublicBatchApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const queryClient = useQueryClient()
  const [authorName, setAuthorName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)

  const { data: batch, isLoading, isError } = useQuery({
    queryKey: ['public-batch-approval', token],
    queryFn: () => fetchBatch(token || ''),
    enabled: !!token,
  })

  const updateStatus = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`/api/public-batch-approval?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
      return res.json()
    },
    onSuccess: (updatedBatch) => {
      queryClient.setQueryData(['public-batch-approval', token], updatedBatch)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dbe-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dbe-blue border-t-transparent" />
      </div>
    )
  }

  if (isError || !batch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dbe-dark p-4 text-center">
        <div className="w-full max-w-md rounded-xl border border-dbe-border bg-dbe-navy p-8">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-dbe-red" />
          <h1 className="mb-2 text-xl font-bold text-dbe-text">Link inválido ou expirado</h1>
          <p className="text-dbe-muted">
            Este link de aprovação não existe ou já expirou.
          </p>
        </div>
      </div>
    )
  }

  const handleApproveAll = () => {
    if (confirm('Tem certeza que deseja aprovar todos os roteiros pendentes?')) {
      updateStatus.mutate({ action: 'approve_all', author_name: authorName })
    }
  }

  const handleApproveItem = (itemId: string) => {
    updateStatus.mutate({ action: 'approve_item', item_id: itemId, author_name: authorName })
  }

  const handleRequestChangesItem = () => {
    if (!commentText.trim() || !selectedScriptId) return
    updateStatus.mutate(
      {
        action: 'request_changes_item',
        item_id: selectedScriptId,
        author_name: authorName,
        comment: commentText,
      },
      {
        onSuccess: () => {
          setCommentText('')
          setSelectedScriptId(null)
        },
      }
    )
  }

  return (
    <div className="min-h-screen bg-dbe-dark p-4 font-sans text-dbe-text md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-dbe-border pb-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-1 text-2xl font-bold">
              {batch.campaign?.title ? `Campanha: ${batch.campaign.title}` : 'Lote de Roteiros'}
            </h1>
            <p className="text-sm text-dbe-muted">
              Para revisão de {batch.client_name || 'Cliente'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Seu nome"
              className="w-40 rounded-lg border border-dbe-border bg-dbe-navy px-3 py-2 text-sm text-dbe-text outline-none transition-colors placeholder:text-dbe-muted/60 focus:border-dbe-blue"
            />
            {batch.items.some((i: any) => i.status === 'pending') && (
              <Button
                className="bg-green-500 text-black hover:bg-green-600"
                onClick={handleApproveAll}
                loading={updateStatus.isPending}
              >
                <ListChecks className="mr-2 h-4 w-4" /> Aprovar todos pendentes
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {batch.items.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-dbe-border bg-dbe-navy p-6">
              <div className="mb-4 flex items-start justify-between border-b border-dbe-border/50 pb-4">
                <h2 className="text-lg font-bold">{item.script.title}</h2>
                <div className="flex items-center gap-2">
                  {item.status === 'approved' && (
                    <span className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500">
                      <CheckCircle2 className="h-4 w-4" /> Aprovado
                    </span>
                  )}
                  {item.status === 'requested_changes' && (
                    <span className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500">
                      <XCircle className="h-4 w-4" /> Ajustes
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-500">
                      Pendente
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-500">Gancho</h3>
                  <p className="whitespace-pre-wrap text-sm text-dbe-muted">{item.script.hook}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-dbe-blue">Desenvolvimento</h3>
                  <p className="whitespace-pre-wrap text-sm text-dbe-muted">{item.script.body}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-green-500">CTA</h3>
                  <p className="whitespace-pre-wrap text-sm text-dbe-muted">{item.script.cta}</p>
                </div>
              </div>

              {item.client_feedback && (
                <div className="mt-4 rounded-lg bg-black/20 p-3">
                  <span className="text-xs font-semibold text-dbe-blue">Observação do Cliente:</span>
                  <p className="mt-1 text-sm">{item.client_feedback}</p>
                </div>
              )}

              {item.status === 'pending' && (
                <div className="mt-6 flex flex-wrap gap-3 border-t border-dbe-border/50 pt-4">
                  {selectedScriptId === item.id ? (
                    <div className="w-full space-y-3">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Descreva o que precisa ser ajustado..."
                        rows={3}
                        className="w-full resize-none rounded-lg border border-dbe-border bg-black/20 px-3 py-2 text-sm text-dbe-text outline-none transition-colors placeholder:text-dbe-muted/60 focus:border-dbe-blue"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          onClick={handleRequestChangesItem}
                          disabled={!commentText.trim()}
                          loading={updateStatus.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Enviar solicitação
                        </Button>
                        <Button variant="ghost" onClick={() => setSelectedScriptId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-500 text-black hover:bg-green-600"
                        onClick={() => handleApproveItem(item.id)}
                        loading={updateStatus.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar este
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedScriptId(item.id)}
                      >
                        Solicitar ajuste
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
