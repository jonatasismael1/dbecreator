import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ai'
  | 'icon'
  | 'deby' // legacy alias

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-success text-white shadow-[0_0_24px_rgba(0,191,85,0.22)] hover:brightness-110',
  secondary:
    'bg-surface-muted/75 text-text hover:bg-surface-elevated border border-border backdrop-blur-md',
  outline:
    'bg-transparent border border-border-strong text-text hover:bg-surface-muted/80',
  ghost:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface-muted/80',
  soft:
    'bg-primary-soft text-primary-soft-foreground hover:bg-primary/20 border border-primary/15',
  success:
    'bg-success text-white hover:brightness-110 shadow-sm shadow-success/20',
  warning:
    'bg-warning text-white hover:brightness-110 shadow-sm',
  danger:
    'bg-danger text-white hover:brightness-110 shadow-sm',
  ai:
    'bg-gradient-to-br from-primary to-success text-white hover:brightness-110 shadow-[0_0_24px_rgba(0,191,85,0.22)]',
  deby:
    'bg-gradient-to-br from-primary to-success text-white hover:brightness-110 shadow-[0_0_24px_rgba(0,191,85,0.22)]',
  icon:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface-muted',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'min-h-[var(--touch-target-min)] px-2.5 text-xs gap-1 rounded-[var(--r-sm)]',
  sm: 'min-h-[var(--touch-target-min)] px-3 text-xs gap-1.5 rounded-[var(--r-md)]',
  md: 'min-h-[var(--touch-target-min)] px-4 text-sm gap-2 rounded-[var(--r-md)]',
  lg: 'min-h-12 px-6 text-base gap-2.5 rounded-[var(--r-lg)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {

    // Icon variant overrides padding
    const appliedSize = variant === 'icon' && !className?.includes('h-') ? 'min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] p-0 rounded-[var(--r-md)]' : sizes[size]

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex touch-manipulation items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.97]',
          variants[variant],
          appliedSize,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
