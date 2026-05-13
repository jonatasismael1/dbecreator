import { useMemo, useState } from 'react'
import { BrainCircuit, FileText, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScripts, useUpdateScript } from '@/features/scripts/hooks/use-scripts'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { AnalysisResultCard } from '../components/analysis-result-card'
import { useAnalyzeScript, useDebyHistory } from '../hooks/use-deby'
import type { AiAnalysis } from '../types/deby.types'

export function DebyPage() {
  const { workspaceId } = useWorkspaceContext()
  const { data: scripts = [], isLoading: scriptsLoading } = useScripts(workspaceId)
  const { data: history = [], isLoading: historyLoading, isError } = useDebyHistory(workspaceId)
  const analyzeScript = useAnalyzeScript(workspaceId)
  const updateScript = useUpdateScript(workspaceId)
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [activeAnalysis, setActiveAnalysis] = useState<AiAnalysis | null>(null)
  const [appliedAnalysisId, setAppliedAnalysisId] = useState<string | null>(null)

  const selectedScript = useMemo(
    () => scripts.find((script) => script.id === selectedScriptId),
    [scripts, selectedScriptId],
  )

  const visibleAnalysis = activeAnalysis ?? history[0] ?? null
  const visibleScript = useMemo(
    () => scripts.find((script) => script.id === visibleAnalysis?.script_id),
    [scripts, visibleAnalysis?.script_id],
  )

  const handleAnalyze = async () => {
    if (!selectedScriptId) return
    const analysis = await analyzeScript.mutateAsync(selectedScriptId)
    setActiveAnalysis(analysis)
    setAppliedAnalysisId(null)
  }

  const handleApplyAnalysis = async () => {
    if (!visibleAnalysis || !visibleScript) return
    const { result } = visibleAnalysis

    await updateScript.mutateAsync({
      id: visibleScript.id,
      dto: {
        hook: result.improved_hook || visibleScript.hook,
        body: result.rewritten_script || visibleScript.body,
        cta: result.improved_cta || visibleScript.cta,
      },
    })

    setAppliedAnalysisId(visibleAnalysis.id)
  }

  if (scriptsLoading || historyLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-dbe-muted">Erro ao carregar analises da Deby.</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Deby IA" description="Analise tecnica e estrategica dos seus roteiros de Reels." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dbe-purple/20 bg-dbe-purple/10">
                <BrainCircuit className="h-5 w-5 text-dbe-purple" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-dbe-text">Nova analise</h2>
                <p className="text-xs text-dbe-muted">O frontend envia apenas o ID do roteiro.</p>
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-dbe-muted">Roteiro</label>
            <select
              value={selectedScriptId}
              onChange={(event) => setSelectedScriptId(event.target.value)}
              className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none transition-all focus:border-dbe-purple/50"
            >
              <option value="">Selecione um roteiro</option>
              {scripts.map((script) => (
                <option key={script.id} value={script.id}>{script.title}</option>
              ))}
            </select>

            {selectedScript && (
              <div className="mt-4 rounded-xl border border-dbe-border bg-dbe-dark/50 p-4">
                <p className="line-clamp-2 text-sm font-semibold text-dbe-text">{selectedScript.title}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-dbe-muted">{selectedScript.hook}</p>
              </div>
            )}

            <Button
              variant="deby"
              onClick={handleAnalyze}
              loading={analyzeScript.isPending}
              disabled={!selectedScriptId}
              className="mt-5 w-full"
            >
              <Sparkles className="h-4 w-4" />
              Analisar com Deby
            </Button>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dbe-text">Historico</h2>
              <Badge variant="purple">{history.length}</Badge>
            </div>
            {history.length === 0 ? (
              <p className="text-xs leading-relaxed text-dbe-muted">As analises aparecem aqui depois da primeira execucao.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 8).map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => {
                      setActiveAnalysis(analysis)
                      setAppliedAnalysisId(null)
                    }}
                    className="w-full rounded-lg border border-dbe-border bg-dbe-dark/40 p-3 text-left transition-all hover:border-dbe-purple/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="line-clamp-1 text-xs font-semibold text-dbe-text">{analysis.scripts?.title ?? 'Roteiro'}</p>
                      <Badge variant="blue">{analysis.result.score.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-dbe-muted">{new Date(analysis.created_at).toLocaleString('pt-BR')}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {visibleAnalysis ? (
          <AnalysisResultCard
            analysis={visibleAnalysis}
            onApply={visibleScript ? handleApplyAnalysis : undefined}
            applying={updateScript.isPending}
            applied={appliedAnalysisId === visibleAnalysis.id}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhuma analise ainda"
            description="Escolha um roteiro e peça para a Deby avaliar score, riscos, alinhamento e melhorias."
          />
        )}
      </div>
    </div>
  )
}
