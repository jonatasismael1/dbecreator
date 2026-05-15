import { useState } from 'react'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { debyService } from '@/features/deby/services/deby.service'
import type { IdeaStatus } from '../types/idea.types'

interface DebyIdeasModalProps {
  open: boolean
  onClose: () => void
  onAddIdeas: (ideas: Array<{ title: string; hook_suggestion: string; pillar: string }>, selectedPillarId: string) => Promise<void>
}

export function DebyIdeasModal({ open, onClose, onAddIdeas }: DebyIdeasModalProps) {
  const { workspaceId } = useWorkspaceContext()
  const { data: pillars = [] } = usePillars(workspaceId)
  
  const [selectedPillarId, setSelectedPillarId] = useState('')
  const [count, setCount] = useState(5)
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPillarId) {
      setError('Selecione um pilar de conteúdo.')
      return
    }

    const selectedPillar = pillars.find(p => p.id === selectedPillarId)
    if (!selectedPillar) return

    setIsLoading(true)
    setError(null)
    try {
      const ideas = await debyService.generateIdeas(selectedPillar.id, selectedPillar.title, count, context)
      await onAddIdeas(ideas, selectedPillar.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar ideias. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-dbe-purple/20 bg-dbe-navy shadow-2xl">
        <div className="flex items-center justify-between border-b border-dbe-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dbe-purple/20 bg-dbe-purple/10">
              <Sparkles className="h-5 w-5 text-dbe-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dbe-text">Gerar com Deby</h2>
              <p className="mt-0.5 text-xs text-dbe-muted">IA Estratégica</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-dbe-muted hover:bg-white/5 hover:text-dbe-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-dbe-text">Pilar Estratégico</label>
            <select
              value={selectedPillarId}
              onChange={(e) => setSelectedPillarId(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text transition-colors focus:border-dbe-purple focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>Selecione um pilar...</option>
              {pillars.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {pillars.length === 0 && (
              <p className="mt-1 text-xs text-amber-400">Nenhum pilar cadastrado. Crie pilares primeiro.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dbe-text">Quantidade de ideias</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={isLoading}
              className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text transition-colors focus:border-dbe-purple focus:outline-none disabled:opacity-50"
            >
              <option value="3">3 ideias</option>
              <option value="5">5 ideias</option>
              <option value="10">10 ideias</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dbe-text">Contexto / Tendência (Opcional)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={isLoading}
              placeholder="Ex: Focar no audio em alta sobre 'escola de negócios' ou assunto atual."
              className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text transition-colors focus:border-dbe-purple focus:outline-none disabled:opacity-50"
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-dbe-red/20 bg-dbe-red/10 px-3 py-2.5 text-sm text-dbe-red">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedPillarId}
              className="bg-dbe-purple text-white hover:bg-dbe-purple/80"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar ideias
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
