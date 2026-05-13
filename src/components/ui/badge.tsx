import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'purple' | 'blue'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-dbe-border text-dbe-muted',
  success: 'bg-dbe-green/15 text-dbe-green border-dbe-green/20',
  warning: 'bg-dbe-amber/15 text-dbe-amber border-dbe-amber/20',
  error: 'bg-dbe-red/15 text-dbe-red border-dbe-red/20',
  purple: 'bg-dbe-purple/15 text-dbe-purple border-dbe-purple/20',
  blue: 'bg-dbe-blue/15 text-dbe-blue border-dbe-blue/20',
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
