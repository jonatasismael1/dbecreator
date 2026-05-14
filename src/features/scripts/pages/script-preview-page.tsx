import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  MonitorPlay,
  Printer,
  Target,
} from 'lucide-react'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { useScripts } from '../hooks/use-scripts'
import {
  downloadScriptDocx,
  downloadScriptHtml,
  getScriptPlainText,
  printScriptAsPdf,
} from '../services/script-export.service'
import type { ScriptStatus } from '../types/script.types'

const statusConfig: Record<ScriptStatus, { label: string; variant: 'default' | 'blue' | 'success' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  ready: { label: 'Pronto', variant: 'blue' },
  in_approval: { label: 'Enviado para aprovação', variant: 'blue' },
  approved: { label: 'Aprovado', variant: 'success' },
  changes_requested: { label: 'Ajuste solicitado', variant: 'default' },
  recorded: { label: 'Gravado', variant: 'success' },
}

export function ScriptPreviewPage() {
  const navigate = useNavigate()
  const { scriptId } = useParams()
  const { workspaceId } = useWorkspaceContext()
  const { data: scripts = [], isLoading, isError } = useScripts(workspaceId)
  const [copied, setCopied] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)

  const script = useMemo(() => scripts.find((item) => item.id === scriptId), [scriptId, scripts])

  const copyScript = async () => {
    if (!script) return
    await navigator.clipboard.writeText(getScriptPlainText(script))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const exportDocx = async () => {
    if (!script) return
    setExportingDocx(true)
    try {
      await downloadScriptDocx(script)
    } finally {
      setExportingDocx(false)
    }
  }

  if (isLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-dbe-muted">Erro ao carregar roteiro. Tente novamente.</p>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <Card className="text-center">
          <FileText className="mx-auto h-10 w-10 text-dbe-muted" />
          <h1 className="mt-4 text-xl font-bold text-dbe-text">Roteiro não encontrado</h1>
          <p className="mt-2 text-sm text-dbe-muted">Ele pode ter sido removido ou pertence a outro workspace.</p>
          <Button className="mt-5" onClick={() => navigate('/scripts')}>
            Voltar para roteiros
          </Button>
        </Card>
      </div>
    )
  }

  const status = statusConfig[script.status]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/scripts')} className="mb-3">
            <ArrowLeft className="h-4 w-4" />
            Roteiros
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {script.content_pillars && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dbe-border px-3 py-1 text-xs text-dbe-muted">
                <Target className="h-3.5 w-3.5" style={{ color: script.content_pillars.color }} />
                {script.content_pillars.title}
              </span>
            )}
            {script.last_analysis_score !== null && (
              <span className="rounded-full border border-dbe-border px-3 py-1 text-xs text-dbe-muted">
                Deby {script.last_analysis_score}/10
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-dbe-text sm:text-3xl">{script.title}</h1>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button variant="secondary" onClick={() => navigate(`/teleprompter/${script.id}`)} className="w-full sm:w-auto">
            <MonitorPlay className="h-4 w-4" />
            Teleprompter
          </Button>
          <Button variant="secondary" onClick={copyScript} className="w-full sm:w-auto">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar
          </Button>
          <Button variant="secondary" onClick={() => downloadScriptHtml(script)} className="w-full sm:w-auto">
            <Download className="h-4 w-4" />
            HTML
          </Button>
          <Button variant="secondary" loading={exportingDocx} onClick={exportDocx} className="w-full sm:w-auto">
            <FileText className="h-4 w-4" />
            DOCX
          </Button>
          <Button onClick={() => printScriptAsPdf(script)} className="col-span-2 w-full sm:col-span-1 sm:w-auto">
            <Printer className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <ScriptSection title="Gancho" accent="green" value={script.hook} />
        <ScriptSection title="Desenvolvimento" accent="blue" value={script.body} />
        <ScriptSection title="CTA" accent="purple" value={script.cta} />
      </div>
    </div>
  )
}

function ScriptSection({ title, value, accent }: { title: string; value: string; accent: 'green' | 'blue' | 'purple' }) {
  const accentClass = {
    green: 'text-dbe-green',
    blue: 'text-dbe-blue',
    purple: 'text-dbe-purple',
  }[accent]

  return (
    <Card className="p-4 sm:p-6">
      <h2 className={`text-xs font-bold uppercase tracking-wider ${accentClass}`}>{title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-dbe-text">{value || '-'}</p>
    </Card>
  )
}
