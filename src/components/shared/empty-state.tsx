import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-surface2 border border-border p-4">
        <Icon className="h-7 w-7 text-text-muted" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-text mb-1.5">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs mb-5 leading-relaxed">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
