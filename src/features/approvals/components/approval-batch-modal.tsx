import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { X, ListChecks, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Script } from '@/features/scripts/types/script.types'
import type { Campaign } from '@/features/campaigns/types/campaign.types'

interface ApprovalBatchModalProps {
  open: boolean
  scripts: Script[]
  campaigns: Campaign[]
  onClose: () => void
  onCreate: (params: {
    campaignId?: string | null
    scriptIds: string[]
    clientName: string
    expiresAt: string
  }) => Promise<void>
  isLoading: boolean
}

export function ApprovalBatchModal({
  open,
  scripts,
  campaigns,
  onClose,
  onCreate,
  isLoading,
}: ApprovalBatchModalProps) {
  const [mode, setMode] = useState<'campaign' | 'scripts'>('scripts')
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [selectedScripts, setSelectedScripts] = useState<string[]>([])
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const defaultExpiry = format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")

  const availableScripts = scripts.filter(
    (s) => !s.archived_at && !['in_approval', 'recorded'].includes(s.status),
  )

  const campaignScripts =
    mode === 'campaign' && selectedCampaign
      ? availableScripts.filter((s) => s.campaign_id === selectedCampaign)
      : []

  const effectiveScriptIds =
    mode === 'campaign' ? campaignScripts.map((s) => s.id) : selectedScripts

  const toggleScript = (id: string) => {
    setSelectedScripts((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!clientName.trim() || clientName.trim().length < 2) {
      setError('Informe o nome do cliente (mínimo 2 caracteres).')
      return
    }
    if (effectiveScriptIds.length === 0) {
      setError('Selecione ao menos um roteiro.')
      return
    }
    try {
      await onCreate({
        campaignId: mode === 'campaign' ? selectedCampaign || null : null,
        scriptIds: effectiveScriptIds,
        clientName: clientName.trim(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o lote.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-dbe-border bg-dbe-navy shadow-2xl">
        <div className="flex items-center justify-between border-b border-dbe-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-dbe-text">Criar lote de aprovação</h2>
            <p className="mt-0.5 text-xs text-dbe-muted">Gere um link para o cliente aprovar vários roteiros de uma vez.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-dbe-muted hover:bg-white/5 hover:text-dbe-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('scripts')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${mode === 'scripts' ? 'border-dbe-blue/40 bg-dbe-blue/10 text-dbe-blue' : 'border-dbe-border text-dbe-muted hover:text-dbe-text'}`}
            >
              <ListChecks className="h-4 w-4" />
              Roteiros avulsos
            </button>
            <button
              type="button"
              onClick={() => setMode('campaign')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${mode === 'campaign' ? 'border-dbe-blue/40 bg-dbe-blue/10 text-dbe-blue' : 'border-dbe-border text-dbe-muted hover:text-dbe-text'}`}
            >
              <Layers className="h-4 w-4" />
              Campanha inteira
            </button>
          </div>

          {/* Campaign select */}
          {mode === 'campaign' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-dbe-text">Campanha</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                required
                className="w-full appearance-none rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text transition-colors focus:border-dbe-blue focus:outline-none"
              >
                <option value="">Selecione uma campanha...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              {selectedCampaign && campaignScripts.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-400">Nenhum roteiro disponível para aprovação nesta campanha.</p>
              )}
              {selectedCampaign && campaignScripts.length > 0 && (
                <p className="mt-1.5 text-xs text-dbe-muted">{campaignScripts.length} roteiro(s) serão incluídos no lote.</p>
              )}
            </div>
          )}

          {/* Script checkboxes */}
          {mode === 'scripts' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dbe-text">
                Roteiros <span className="text-dbe-muted">({selectedScripts.length} selecionados)</span>
              </label>
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-dbe-border bg-dbe-dark p-3">
                {availableScripts.length === 0 && (
                  <p className="py-4 text-center text-sm text-dbe-muted">Nenhum roteiro disponível para aprovação.</p>
                )}
                {availableScripts.map((script) => (
                  <label
                    key={script.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScripts.includes(script.id)}
                      onChange={() => toggleScript(script.id)}
                      className="h-4 w-4 accent-dbe-blue"
                    />
                    <span className="flex-1 truncate text-sm text-dbe-text">{script.title}</span>
                    {script.status === 'ready' && (
                      <Badge variant="default" className="border-green-500/20 bg-green-500/10 text-xs text-green-500">Pronto</Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Client name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dbe-text">Nome do cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              minLength={2}
              placeholder="Ex: Maria Oliveira"
              className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text transition-colors focus:border-dbe-blue focus:outline-none"
            />
          </div>

          <p className="text-xs text-dbe-muted">
            O link gerado será válido por 7 dias ({defaultExpiry}). Qualquer pessoa com o link pode aprovar sem login.
          </p>

          {error && (
            <div className="rounded-lg border border-dbe-red/20 bg-dbe-red/10 px-3 py-2.5 text-sm text-dbe-red">
              {error}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 border-t border-dbe-border p-4">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            loading={isLoading}
            disabled={effectiveScriptIds.length === 0}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
          >
            <ListChecks className="h-4 w-4" />
            Criar lote ({effectiveScriptIds.length})
          </Button>
        </div>
      </div>
    </div>
  )
}
