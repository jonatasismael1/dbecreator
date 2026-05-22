export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-[13px] text-text-muted animate-pulse">Carregando...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--r-lg)] border border-border bg-surface p-5 animate-pulse">
      <div className="h-3.5 bg-surface2 rounded-full w-3/4 mb-3" />
      <div className="h-3 bg-surface2 rounded-full w-1/2 mb-6" />
      <div className="h-7 bg-surface2 rounded-[var(--r-md)] w-1/3" />
    </div>
  )
}
