import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type CardVariant = 'default' | 'elevated' | 'subtle' | 'interactive' | 'glass'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  hover?: boolean
  glass?: boolean
}

const variants: Record<CardVariant, string> = {
  default: 'glass-panel',
  elevated: 'bg-surface-elevated/90 border border-border-strong/70 shadow-2xl shadow-black/20',
  subtle: 'bg-surface-muted/70 border border-border/80',
  interactive: 'glass-panel transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer',
  glass: 'glass-panel',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, glass, children, ...props }, ref) => {

    // Map legacy props for compatibility
    let activeVariant: CardVariant = variant || 'default'
    if (glass) activeVariant = 'glass'
    else if (hover) activeVariant = 'interactive'

    return (
      <div
        ref={ref}
        className={cn(
          'min-w-0 rounded-[var(--r-lg)] p-5',
          variants[activeVariant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight text-text', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-4 mt-auto border-t border-border', className)} {...props}>
      {children}
    </div>
  )
}
