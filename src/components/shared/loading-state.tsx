export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-dbe-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-dbe-blue animate-spin" />
        </div>
        <p className="text-sm text-dbe-muted animate-pulse">Carregando...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-dbe-border bg-dbe-navy p-5 animate-pulse">
      <div className="h-4 bg-dbe-border rounded w-3/4 mb-3" />
      <div className="h-3 bg-dbe-border rounded w-1/2 mb-6" />
      <div className="h-8 bg-dbe-border rounded w-1/3" />
    </div>
  )
}
