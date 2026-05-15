import { useState } from 'react'
import { Sparkles, X, Loader2, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { debyService } from '@/features/deby/services/deby.service'

interface IdeaResult {
  title: string
  hook_suggestion: string
  pillar: string
}

interface DebyIdeasModalProps {
  open: boolean
  onClose: () => void
  onAddIdeas: (ideas: IdeaResult[], selectedPillarId: string) => Promise<void>
  initialContext?: string
}

export function DebyIdeasModal({ open, onClose, onAddIdeas, initialContext }: DebyIdeasModalProps) {
  const { workspaceId } = useWorkspaceContext()
  const { data: pillars = [] } = usePillars(workspaceId)
  
  const [selectedPillarId, setSelectedPillarId] = useState('')
  const [count, setCount] = useState(5)
  const [context, setContext] = useState(initialContext ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaResult[]>([])
  const [step, setStep] = useState<'config' | 'review'>('config')

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
      setGeneratedIdeas(ideas)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar ideias. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSelected = async () => {
    setIsLoading(true)
    try {
      await onAddIdeas(generatedIdeas, selectedPillarId)
      handleClose()
    } catch (err) {
      setError('Erro ao salvar algumas ideias.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectIdea = (index: number) => {
    setGeneratedIdeas(prev => prev.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    setStep('config')
    setGeneratedIdeas([])
    setSelectedPillarId('')
    setContext('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="modal-panel w-full max-w-lg overflow-hidden rounded-[var(--r-xl)] border border-dbe-green/30 bg-dbe-navy shadow-2xl">
        <div className="modal-drag-handle" />
        <div className="flex items-center justify-between border-b border-dbe-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dbe-green/30 bg-dbe-green/10">
              <Sparkles className="h-5 w-5 text-dbe-green" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dbe-text">
                {step === 'config' ? (initialContext ? 'Deby AI: Desenvolver ideia' : 'Gerar com Deby AI') : 'Revisar Sugestões'}
              </h2>
              <p className="mt-0.5 text-xs text-dbe-muted">
                {step === 'config' ? 'Estratégia de Conteúdo' : `${generatedIdeas.length} ideias sugeridas`}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="touch-target rounded-lg p-1.5 text-dbe-muted hover:bg-white/5 hover:text-dbe-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-scroll-body p-5">
          {step === 'config' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-dbe-text">Pilar Estratégico</label>
                <select
                  value={selectedPillarId}
                  onChange={(e) => setSelectedPillarId(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none focus:border-dbe-blue"
                >
                  <option value="" disabled>Selecione um pilar...</option>
                  {pillars.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {pillars.length === 0 && (
                  <p className="mt-1 text-xs text-warning">Nenhum pilar cadastrado. Crie pilares primeiro.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dbe-text">Quantidade de ideias</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none focus:border-dbe-blue"
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
                  className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none focus:border-dbe-blue resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-dbe-red/20 bg-dbe-red/10 px-3 py-2 text-sm text-dbe-red">
                  {error}
                </div>
              )}

              <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || !selectedPillarId} variant="deby">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Gerando...' : 'Gerar ideias'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[350px] space-y-3 overflow-y-auto pr-1">
                {generatedIdeas.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-dbe-muted">Todas as ideias foram rejeitadas.</p>
                  </div>
                ) : (
                  generatedIdeas.map((idea, idx) => (
                    <div key={idx} className="group relative rounded-xl border border-dbe-border bg-dbe-dark/50 p-4 transition-all hover:border-dbe-blue/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-dbe-text">{idea.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-dbe-muted line-clamp-2">{idea.hook_suggestion}</p>
                        </div>
                        <button 
                          onClick={() => handleRejectIdea(idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-dbe-muted transition-colors hover:bg-dbe-red/10 hover:text-dbe-red"
                          title="Rejeitar ideia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-dbe-border pt-4 sm:flex-row">
                <Button type="button" variant="ghost" onClick={() => setStep('config')} disabled={isLoading}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleAddSelected} 
                  disabled={isLoading || generatedIdeas.length === 0} 
                  variant="deby"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Adicionando...' : `Adicionar ${generatedIdeas.length} Ideias`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
