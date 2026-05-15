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
  default: 'bg-surface2 text-text-muted border-border',
  primary: 'bg-primary/10 text-primary-soft-foreground border-primary/20 shadow-sm',
  success: 'bg-success/10 text-success-soft-foreground border-success/20',
  warning: 'bg-warning/10 text-warning-soft-foreground border-warning/20',
  danger: 'bg-danger/10 text-danger-soft-foreground border-danger/20',
  info: 'bg-primary/10 text-primary-soft-foreground border-primary/20',
  ai: 'bg-success/10 text-success-soft-foreground border-success/20 shadow-sm',
  muted: 'bg-transparent border-border text-text-muted',
  // legacy maps
  error: 'bg-danger/10 text-danger-soft-foreground border-danger/20',
  purple: 'bg-success/10 text-success-soft-foreground border-success/20',
  blue: 'bg-primary/10 text-primary-soft-foreground border-primary/20',
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
