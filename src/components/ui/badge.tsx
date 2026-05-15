import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ai'
  | 'muted'
  | 'error'
  | 'purple'
  | 'blue'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted/70 text-text-muted border-border',
  primary: 'bg-primary-soft/90 text-primary-soft-foreground border-primary/35 shadow-sm shadow-primary/10',
  success: 'bg-success-soft/90 text-success-soft-foreground border-success/35',
  warning: 'bg-warning-soft/90 text-warning-soft-foreground border-warning/25',
  danger: 'bg-danger-soft/90 text-danger-soft-foreground border-danger/25',
  info: 'bg-info-soft/90 text-info-soft-foreground border-info/35',
  ai: 'bg-ai-soft/90 text-ai-soft-foreground border-ai/35 shadow-sm shadow-ai/10',
  muted: 'bg-transparent border-border-strong text-text-muted',
  // legacy maps
  error: 'bg-danger-soft text-danger-soft-foreground border-danger/20',
  purple: 'bg-ai-soft text-ai-soft-foreground border-ai/35',
  blue: 'bg-primary-soft text-primary-soft-foreground border-primary/35',
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
