import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">DBE Creator</p>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-text leading-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-text-muted">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2.5 sm:mt-0.5">
          {children}
        </div>
      )}
    </div>
  )
}
