import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">DBE Creator</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">{description}</p>
        )}
      </div>
      {children && <div className="flex w-full items-center gap-3 sm:w-auto">{children}</div>}
    </div>
  )
}
