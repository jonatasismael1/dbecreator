import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, AlertTriangle, ListChecks,
  MessageSquare, CheckCheck, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScriptContentBlock } from '@/features/scripts/components/script-content-block'

type ItemStatus = 'pending' | 'approved' | 'requested_changes'

interface PublicBatchScript {
  id: string
  title: string
  hook: string
  body: string
  cta: string
  status: string
}

interface PublicBatchItem {
  id: string
  status: ItemStatus
  client_feedback: string | null
  script: PublicBatchScript
}

interface PublicBatch {
  id: string
  status: string
  client_name: string | null
  workspace?: { name: string; logo_url: string | null } | null
  campaign?: { title?: string | null } | null
  items: PublicBatchItem[]
}

type UpdateBatchPayload =
  | { action: 'approve_all'; author_name: string }
  | { action: 'approve_selected'; item_ids: string[]; author_name: string }
  | { action: 'approve_item'; item_id: string; author_name: string }
  | { action: 'request_changes_item'; item_id: string; author_name: string; comment: string }

interface SectionComment { section: 'GANCHO' | 'DESENVOLVIMENTO' | 'CTA'; text: string }

async function fetchBatch(token: string): Promise<PublicBatch> {
  const res = await fetch(`/api/public-batch-approval?token=${token}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message || 'Link de aprovação inválido.')
  }
  return res.json()
}

async function postBatch(token: string, payload: UpdateBatchPayload): Promise<PublicBatch> {
  const res = await fetch(`/api/public-batch-approval?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message || 'Erro ao atualizar aprovação.')
  }
  return res.json()
}

const SECTION_COLORS = {
  GANCHO: 'text-amber-400',
  DESENVOLVIMENTO: 'text-dbe-blue',
  CTA: 'text-green-400',
}

export function PublicBatchApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const queryClient = useQueryClient()

  const [authorName, setAuthorName] = useState('')

  // Multi-select state (P2.1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmApproveSelected, setConfirmApproveSelected] = useState(false)
  const [confirmApproveAll, setConfirmApproveAll] = useState(false)

  // Per-item feedback (request_changes)
  const [requestingItemId, setRequestingItemId] = useState<string | null>(null)
  const [requestCommentText, setRequestCommentText] = useState('')

  // Per-section comments (P2.3): map of itemId → array of section comments
  const [sectionComments, setSectionComments] = useState<Record<string, SectionComment[]>>({})
  const [activeCommentSection, setActiveCommentSection] = useState<{ itemId: string; section: SectionComment['section'] } | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submittedComments, setSubmittedComments] = useState<Record<string, SectionComment[]>>({})

  const { data: batch, isLoading, isError } = useQuery({
    queryKey: ['public-batch-approval', token],
    queryFn: () => fetchBatch(token || ''),
    enabled: !!token,
    retry: false,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBatchPayload) => postBatch(token || '', payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['public-batch-approval', token], updated)
      setSelectedIds([])
      setConfirmApproveSelected(false)
      setConfirmApproveAll(false)
      setRequestingItemId(null)
      setRequestCommentText('')
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dbe-dark">
        <Loader2 className="h-8 w-8 animate-spin text-dbe-blue" />
      </div>
    )
  }

  if (isError || !batch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dbe-dark p-4 text-center">
        <div className="w-full max-w-md rounded-xl border border-dbe-border bg-dbe-navy p-8">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-dbe-red" />
          <h1 className="mb-2 text-xl font-bold text-dbe-text">Link inválido ou expirado</h1>
          <p className="text-sm text-dbe-muted">Este link de aprovação não existe ou já expirou.</p>
        </div>
      </div>
    )
  }

  const pendingItems = batch.items.filter((i) => i.status === 'pending')
  const allSelected = pendingItems.length > 0 && pendingItems.every((i) => selectedIds.includes(i.id))

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    const pendingIds = pendingItems.map((i) => i.id)
    setSelectedIds(allSelected ? [] : pendingIds)
  }

  const handleApproveSelected = () => {
    if (selectedIds.length === 0) return
    const ids = selectedIds
    // Approve each one sequentially using approve_item action (existing API)
    const pending = [...ids]
    const approveNext = (remaining: string[]) => {
      if (remaining.length === 0) return
      const [first, ...rest] = remaining
      updateMutation.mutate(
        { action: 'approve_item', item_id: first, author_name: authorName },
        { onSuccess: () => approveNext(rest) },
      )
    }
    approveNext(pending)
    setConfirmApproveSelected(false)
  }

  const handleApproveAll = () => {
    updateMutation.mutate({ action: 'approve_all', author_name: authorName })
  }

  const handleRequestChanges = () => {
    if (!requestCommentText.trim() || !requestingItemId) return
    updateMutation.mutate({
      action: 'request_changes_item',
      item_id: requestingItemId,
      author_name: authorName,
      comment: requestCommentText,
    })
  }

  // Section comment submission (client-side only — stored locally + future API)
  const handleAddSectionComment = (itemId: string, section: SectionComment['section']) => {
    if (!commentText.trim() || !authorName.trim()) return
    const newComment: SectionComment = { section, text: commentText.trim() }
    setSubmittedComments((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), newComment],
    }))
    setCommentText('')
    setActiveCommentSection(null)
  }

  const getRequiresName = () => {
    if (!authorName.trim()) return true
    return false
  }

  const nameRequired = getRequiresName()

  return (
    <div className="min-h-screen bg-dbe-dark p-4 font-sans text-dbe-text md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-dbe-border pb-6 md:flex-row md:items-center">
          <div>
            {batch.workspace?.logo_url ? (
              <img src={batch.workspace.logo_url} alt={batch.workspace.name} className="mb-3 h-10 max-w-40 object-contain" />
            ) : (
              <p className="mb-2 text-sm font-semibold text-dbe-muted">{batch.workspace?.name || 'DBE Creator'}</p>
            )}
            <h1 className="text-2xl font-bold">
              {batch.campaign?.title ? `Campanha: ${batch.campaign.title}` : 'Lote de Roteiros'}
            </h1>
            <p className="mt-1 text-sm text-dbe-muted">Para revisão de {batch.client_name || 'Cliente'}</p>
          </div>

          {/* Name + batch actions */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Seu nome (obrigatório)"
              className="w-52 rounded-lg border border-dbe-border bg-dbe-navy px-3 py-2 text-sm text-dbe-text outline-none transition-colors placeholder:text-dbe-muted/60 focus:border-dbe-blue"
            />

            <div className="flex flex-wrap gap-2">
              {/* Approve selected */}
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  className="bg-dbe-blue text-white hover:bg-dbe-blue/80"
                  onClick={() => setConfirmApproveSelected(true)}
                  loading={updateMutation.isPending}
                  disabled={nameRequired}
                >
                  <CheckCheck className="mr-1.5 h-4 w-4" />
                  Aprovar selecionados ({selectedIds.length})
                </Button>
              )}

              {/* Approve all */}
              {pendingItems.length > 0 && selectedIds.length === 0 && (
                <Button
                  size="sm"
                  className="bg-green-500 text-black hover:bg-green-600"
                  onClick={() => setConfirmApproveAll(true)}
                  loading={updateMutation.isPending}
                  disabled={nameRequired}
                >
                  <ListChecks className="mr-1.5 h-4 w-4" />
                  Aprovar todos pendentes
                </Button>
              )}
            </div>
            {nameRequired && (pendingItems.length > 0) && (
              <p className="text-xs text-amber-400">Informe seu nome antes de aprovar.</p>
            )}
          </div>
        </div>

        {/* Select all toggle */}
        {pendingItems.length > 1 && (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dbe-border/40 bg-dbe-navy/50 px-4 py-2.5">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-dbe-blue"
            />
            <span className="text-sm text-dbe-muted">Selecionar todos os roteiros pendentes</span>
          </label>
        )}

        {/* Items */}
        <div className="space-y-6">
          {batch.items.map((item) => {
            const isSelected = selectedIds.includes(item.id)
            const itemSectionComments = submittedComments[item.id] ?? []
            const isRequestingThis = requestingItemId === item.id

            return (
              <div
                key={item.id}
                className={`relative rounded-xl border bg-dbe-navy p-6 transition-colors ${isSelected ? 'border-dbe-blue/60' : 'border-dbe-border'}`}
              >
                {/* Checkbox for pending items */}
                {item.status === 'pending' && (
                  <label className="absolute left-4 top-4 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 accent-dbe-blue"
                    />
                  </label>
                )}

                <div className={`mb-4 flex items-start justify-between border-b border-dbe-border/50 pb-4 ${item.status === 'pending' ? 'pl-7' : ''}`}>
                  <h2 className="text-lg font-bold">{item.script.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'approved' && (
                      <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500">
                        <CheckCircle2 className="h-4 w-4" /> Aprovado
                      </span>
                    )}
                    {item.status === 'requested_changes' && (
                      <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500">
                        <XCircle className="h-4 w-4" /> Ajustes solicitados
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-500">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Script sections with inline comment buttons (P2.3) */}
                <div className="space-y-5">
                  {(
                    [
                      { key: 'GANCHO', label: 'Gancho', value: item.script.hook },
                      { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento', value: item.script.body },
                      { key: 'CTA', label: 'CTA', value: item.script.cta },
                    ] as const
                  ).map(({ key, label, value }) => {
                    const sectionCommentList = itemSectionComments.filter((c) => c.section === key)
                    const isActiveComment = activeCommentSection?.itemId === item.id && activeCommentSection?.section === key

                    return (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className={`text-xs font-bold uppercase tracking-wider ${SECTION_COLORS[key]}`}>{label}</h3>
                          <button
                            onClick={() => {
                              if (isActiveComment) {
                                setActiveCommentSection(null)
                              } else {
                                setActiveCommentSection({ itemId: item.id, section: key })
                                setCommentText('')
                              }
                            }}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {sectionCommentList.length > 0 ? `${sectionCommentList.length} comentário(s)` : 'Comentar'}
                          </button>
                        </div>
                        <ScriptContentBlock value={value} className="text-sm text-dbe-muted" />

                        {/* Show existing section comments */}
                        {sectionCommentList.length > 0 && (
                          <div className="mt-2 space-y-1.5 rounded-lg border border-dbe-border/40 bg-black/10 p-3">
                            {sectionCommentList.map((c, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium text-dbe-text">{authorName || 'Você'}: </span>
                                <span className="text-dbe-muted">{c.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline comment form */}
                        {isActiveComment && (
                          <div className="mt-2 space-y-2 rounded-lg border border-dbe-blue/30 bg-dbe-blue/5 p-3">
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder={`Comentário sobre o ${label}...`}
                              rows={2}
                              className="w-full resize-none rounded-lg border border-dbe-border bg-black/20 px-3 py-2 text-sm text-dbe-text outline-none placeholder:text-dbe-muted/60 focus:border-dbe-blue"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAddSectionComment(item.id, key)}
                                disabled={!commentText.trim() || nameRequired}
                              >
                                Adicionar comentário
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setActiveCommentSection(null)}>
                                Cancelar
                              </Button>
                            </div>
                            {nameRequired && <p className="text-xs text-amber-400">Informe seu nome no topo para comentar.</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Existing client_feedback */}
                {item.client_feedback && (
                  <div className="mt-4 rounded-lg bg-black/20 p-3">
                    <span className="text-xs font-semibold text-dbe-blue">Observação do Cliente:</span>
                    <p className="mt-1 text-sm">{item.client_feedback}</p>
                  </div>
                )}

                {/* Per-item actions (pending only, no checkbox selected) */}
                {item.status === 'pending' && !isSelected && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-dbe-border/50 pt-4">
                    {isRequestingThis ? (
                      <div className="w-full space-y-3">
                        <textarea
                          value={requestCommentText}
                          onChange={(e) => setRequestCommentText(e.target.value)}
                          placeholder="Descreva o que precisa ser ajustado..."
                          rows={3}
                          className="w-full resize-none rounded-lg border border-dbe-border bg-black/20 px-3 py-2 text-sm text-dbe-text outline-none transition-colors placeholder:text-dbe-muted/60 focus:border-dbe-blue"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                            onClick={handleRequestChanges}
                            disabled={!requestCommentText.trim() || nameRequired}
                            loading={updateMutation.isPending}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" /> Enviar solicitação
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setRequestingItemId(null); setRequestCommentText('') }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-500 text-black hover:bg-green-600"
                          onClick={() => updateMutation.mutate({ action: 'approve_item', item_id: item.id, author_name: authorName })}
                          loading={updateMutation.isPending}
                          disabled={nameRequired}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Aprovar este
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={nameRequired}
                          onClick={() => { setRequestingItemId(item.id); setRequestCommentText('') }}
                        >
                          Solicitar ajuste
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Confirmation modals */}
        {(confirmApproveSelected || confirmApproveAll) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-dbe-border bg-dbe-navy p-6">
              <h2 className="mb-2 text-lg font-bold text-dbe-text">Confirmar aprovação</h2>
              <p className="mb-5 text-sm text-dbe-muted">
                {confirmApproveSelected
                  ? `Você vai aprovar ${selectedIds.length} roteiro(s) selecionado(s). Confirma?`
                  : `Você vai aprovar todos os ${pendingItems.length} roteiro(s) pendentes. Confirma?`}
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => { setConfirmApproveSelected(false); setConfirmApproveAll(false) }}>
                  Cancelar
                </Button>
                <Button
                  className="bg-green-500 text-black hover:bg-green-600"
                  loading={updateMutation.isPending}
                  onClick={confirmApproveSelected ? handleApproveSelected : handleApproveAll}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
