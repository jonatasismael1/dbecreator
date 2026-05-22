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
  elevated: 'bg-surface border border-border-strong shadow-[var(--shadow-md)]',
  subtle: 'bg-surface2/60 border border-border/60',
  interactive:
    'glass-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)] hover:shadow-primary/8 cursor-pointer',
  glass: 'glass-panel',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, glass, children, ...props }, ref) => {
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
    <h3 className={cn('text-[15px] font-semibold tracking-tight text-text', className)} {...props}>
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
