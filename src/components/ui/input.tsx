import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[var(--r-md)] border border-border bg-input px-3 py-2 text-sm',
          'text-text placeholder:text-text-subtle/45',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
