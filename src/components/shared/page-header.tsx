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
        <h1 className="text-2xl font-bold font-display text-dbe-text tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-dbe-muted">{description}</p>
        )}
      </div>
      {children && <div className="flex w-full items-center gap-3 sm:w-auto">{children}</div>}
    </div>
  )
}
