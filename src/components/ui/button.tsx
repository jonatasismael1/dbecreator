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
    'bg-gradient-to-br from-primary to-primary-hover text-white shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.97]',
  secondary:
    'bg-surface2 text-text hover:bg-surface-elevated border border-border active:scale-[0.97]',
  outline:
    'bg-transparent border border-border text-text hover:bg-surface2 active:scale-[0.97]',
  ghost:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface2 active:scale-[0.97]',
  soft:
    'bg-primary/10 text-primary-soft-foreground hover:bg-primary/18 border border-primary/10 active:scale-[0.97]',
  success:
    'bg-gradient-to-br from-success to-success-dark text-white hover:brightness-110 shadow-md shadow-success/20 active:scale-[0.97]',
  warning:
    'bg-gradient-to-br from-warning to-warning/90 text-white hover:brightness-110 shadow-md shadow-warning/20 active:scale-[0.97]',
  danger:
    'bg-gradient-to-br from-danger to-danger/90 text-white hover:brightness-110 shadow-md shadow-danger/20 active:scale-[0.97]',
  ai:
    'bg-gradient-to-br from-primary to-success text-white hover:brightness-110 shadow-md shadow-primary/20 active:scale-[0.97]',
  deby:
    'bg-gradient-to-br from-primary to-success text-white hover:brightness-110 shadow-md shadow-primary/20 active:scale-[0.97]',
  icon:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface2 active:scale-[0.97]',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-[var(--r-sm)]',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[var(--r-md)]',
  md: 'h-9 px-4 text-sm gap-2 rounded-[var(--r-md)]',
  lg: 'h-11 px-6 text-base gap-2.5 rounded-[var(--r-lg)]',
}

const mobileSizes: Record<ButtonSize, string> = {
  xs: 'max-sm:min-h-[36px]',
  sm: 'max-sm:min-h-[40px]',
  md: 'max-sm:min-h-[44px]',
  lg: 'max-sm:min-h-[48px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const isIcon = variant === 'icon'
    const sizeClass = isIcon && !className?.includes('h-')
      ? 'h-9 w-9 p-0 rounded-[var(--r-md)]'
      : sizes[size]
    const mobileSizeClass = isIcon ? '' : mobileSizes[size]

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex touch-manipulation items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizeClass,
          mobileSizeClass,
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
