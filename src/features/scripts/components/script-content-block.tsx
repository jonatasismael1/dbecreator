import { sanitizeScriptHtml } from '../utils/script-content'

export function ScriptContentBlock({ value, className = '' }: { value?: string | null; className?: string }) {
  return (
    <div
      className={`script-content whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeScriptHtml(value) }}
    />
  )
}
