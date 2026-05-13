import { History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ScriptVersion } from '../types/script.types'

interface ScriptVersionHistoryProps {
  versions: ScriptVersion[]
  isLoading?: boolean
}

export function ScriptVersionHistory({ versions, isLoading }: ScriptVersionHistoryProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-dbe-border bg-dbe-dark/50 p-4">
        <p className="text-xs text-dbe-muted">Carregando versoes...</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dbe-border bg-dbe-dark/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-dbe-purple" />
          <p className="text-sm font-semibold text-dbe-text">Versoes salvas</p>
        </div>
        <Badge variant="purple">{versions.length}</Badge>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs leading-relaxed text-dbe-muted">
          As versoes anteriores aparecem aqui depois que este roteiro for editado.
        </p>
      ) : (
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {versions.map((version) => (
            <article key={version.id} className="rounded-lg border border-dbe-border/70 bg-dbe-navy/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-dbe-text">Versao {version.version_number}</p>
                <time className="text-[10px] text-dbe-muted">
                  {new Date(version.created_at).toLocaleDateString('pt-BR')}
                </time>
              </div>
              <p className="line-clamp-1 text-xs font-medium text-dbe-muted">{version.title}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-dbe-muted/80">{version.hook}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
