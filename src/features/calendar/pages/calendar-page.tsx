import { useMemo, useState, type DragEvent } from 'react'
import { ChevronLeft, ChevronRight, Clock, Trash2, Calendar as CalendarIcon, CalendarRange } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { useCalendarItems, useCreateCalendarItem, useDeleteCalendarItem, useUpdateCalendarItem } from '../hooks/use-calendar-items'
import type { CalendarItem, CalendarPlatform } from '../types/calendar.types'

type CalendarStageFilter = 'all' | 'recording' | 'editing' | 'posting'

const stageFilters: Array<{ value: CalendarStageFilter; label: string }> = [
  { value: 'recording', label: 'Gravação' },
  { value: 'editing', label: 'Edição' },
  { value: 'posting', label: 'Postagem' },
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

type MobileViewType = 'month' | 'week'

export function CalendarPage() {
  const { workspaceId } = useWorkspaceContext()
  const { data: items = [], isLoading: itemsLoading } = useCalendarItems(workspaceId)
  const { data: scripts = [], isLoading: scriptsLoading } = useScripts(workspaceId)
  const createItem = useCreateCalendarItem(workspaceId)
  const updateItem = useUpdateCalendarItem(workspaceId)
  const deleteItem = useDeleteCalendarItem(workspaceId)
  
  const [cursor, setCursor] = useState(startOfMonth(new Date()))
  const [weekCursor, setWeekCursor] = useState(startOfWeek(new Date()))
  const [stage, setStage] = useState<CalendarStageFilter>('posting')
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<MobileViewType>('week')
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)

  // Stage filter: filter calendar items by associated script dates
  const filteredItems = useMemo(() => {
    if (stage === 'all') return items
    return items.filter((item) => {
      const script = scripts.find((s) => s.id === item.script_id)
      if (!script) return false
      if (stage === 'recording') return Boolean(script.recording_date)
      if (stage === 'posting') return Boolean(script.posting_date)
      // 'editing': scripts that have recording_date but no posting_date yet (between stages)
      if (stage === 'editing') return Boolean(script.recording_date) && !script.posting_date
      return true
    })
  }, [items, scripts, stage])
  const scheduledScriptIds = new Set(items.map((item) => item.script_id).filter(Boolean))
  const unscheduledScripts = scripts.filter((script) => !scheduledScriptIds.has(script.id))
  
  const days = buildMonthGrid(cursor)
  const monthDays = useMemo(() => buildCurrentMonthDays(cursor), [cursor])
  const weekGrid = useMemo(() => buildWeekGrid(weekCursor), [weekCursor])

  const itemsByDate = useMemo(() => {
    return filteredItems.reduce<Record<string, CalendarItem[]>>((acc, item) => {
      const key = toDateKey(new Date(item.publish_date))
      acc[key] = [...(acc[key] ?? []), item]
      return acc
    }, {})
  }, [filteredItems])

  const scheduleScript = async (scriptId: string, date: Date) => {
    await createItem.mutateAsync({
      script_id: scriptId,
      publish_date: atNoon(date).toISOString(),
      platform: 'reels',
    })
    setSelectedScriptId(null)
  }

  const moveItem = async (itemId: string, date: Date) => {
    const current = items.find((item) => item.id === itemId)
    if (!current) return
    await updateItem.mutateAsync({
      id: itemId,
      dto: { publish_date: atNoon(date).toISOString(), platform: current.platform },
    })
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>, date: Date) => {
    event.preventDefault()
    setDragOverDay(null)
    const scriptId = event.dataTransfer.getData('application/dbe-script')
    const itemId = event.dataTransfer.getData('application/dbe-calendar-item')
    if (scriptId) await scheduleScript(scriptId, date)
    if (itemId) await moveItem(itemId, date)
  }

  const handleDayClick = async (date: Date) => {
    if (selectedScriptId) {
      await scheduleScript(selectedScriptId, date)
    }
  }

  if (itemsLoading || scriptsLoading) return <LoadingState />

  const mobileDays = mobileView === 'month' ? monthDays : weekGrid
  const displayDate = mobileView === 'month' 
    ? cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : `${weekGrid[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekGrid[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`

  const handlePrev = () => {
    if (window.innerWidth < 768 && mobileView === 'week') {
      const d = new Date(weekCursor)
      d.setDate(d.getDate() - 7)
      setWeekCursor(d)
    } else {
      setCursor(addMonths(cursor, -1))
    }
  }

  const handleNext = () => {
    if (window.innerWidth < 768 && mobileView === 'week') {
      const d = new Date(weekCursor)
      d.setDate(d.getDate() + 7)
      setWeekCursor(d)
    } else {
      setCursor(addMonths(cursor, 1))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Calendário editorial">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold capitalize text-text">
          {displayDate}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile View Toggle */}
          <div className="md:hidden flex items-center gap-1 rounded-[var(--r-md)] border border-border bg-surface2 p-1 mr-2">
            <button
              onClick={() => setMobileView('week')}
              className={cn('touch-target flex items-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-1 text-xs font-medium transition-colors', mobileView === 'week' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text')}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Semana
            </button>
            <button
              onClick={() => setMobileView('month')}
              className={cn('touch-target flex items-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-1 text-xs font-medium transition-colors', mobileView === 'month' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text')}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Mês
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {stageFilters.map((option) => (
              <button
                key={option.value}
                onClick={() => setStage(option.value)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  stage === option.value ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-text-muted hover:text-text',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4 md:hidden">
          {mobileView === 'week' ? (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {mobileDays.map((day) => {
                const key = toDateKey(day)
                const dayItems = itemsByDate[key] ?? []
                return (
                  <div
                    key={key}
                    onClick={() => handleDayClick(day)}
                    onDragOver={(event) => { event.preventDefault(); setDragOverDay(key) }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(event) => handleDrop(event, day)}
                    className={cn(
                      'min-w-[280px] snap-center rounded-2xl border bg-surface p-4 transition-all shadow-sm',
                      dragOverDay === key ? 'border-primary bg-primary/5' : 'border-border',
                      selectedScriptId ? 'ring-1 ring-primary/20 bg-primary/5' : '',
                      isToday(day) && 'border-success/30 bg-success/5'
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-baseline gap-2">
                        <span className={cn("text-xl font-bold", isToday(day) ? "text-success" : "text-text")}>{day.getDate()}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                      </div>
                      {isToday(day) ? <Badge variant="success">Hoje</Badge> : <span className="text-[10px] font-bold text-text-muted uppercase">{dayItems.length || 'Livre'}</span>}
                    </div>

                    <div className="space-y-3 min-h-[120px]">
                      {dayItems.length > 0 ? dayItems.map((item) => (
                        <article
                          key={item.id}
                          className="group rounded-xl border border-border bg-surface2 p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 break-words text-sm font-semibold leading-tight text-text">
                              {item.scripts?.title ?? 'Roteiro sem título'}
                            </p>
                            <button onClick={(e) => { e.stopPropagation(); deleteItem.mutateAsync(item.id) }} className="touch-target shrink-0 rounded-lg text-text-muted transition-colors hover:text-danger">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <Badge variant={item.platform === 'reels' ? 'ai' : item.platform === 'tiktok' ? 'primary' : 'success'}>
                              {item.platform}
                            </Badge>
                          </div>
                        </article>
                      )) : (
                        <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center">
                          <p className="text-xs text-text-muted">
                            {selectedScriptId ? 'Toque para agendar aqui' : 'Arraste roteiros aqui'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {mobileDays.map((day) => {
                const key = toDateKey(day)
                const dayItems = itemsByDate[key] ?? []
                return (
                  <div
                    key={key}
                    onClick={() => handleDayClick(day)}
                    onDragOver={(event) => { event.preventDefault(); setDragOverDay(key) }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(event) => handleDrop(event, day)}
                    className={cn(
                      'rounded-2xl border bg-surface p-4 transition-all shadow-sm',
                      dragOverDay === key ? 'border-primary bg-primary/5' : 'border-border',
                      selectedScriptId ? 'ring-1 ring-primary/20 bg-primary/5' : '',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-text">{day.getDate()}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                      </div>
                      {isToday(day) ? <Badge variant="success">Hoje</Badge> : <span className="text-[10px] font-bold text-text-muted uppercase">{dayItems.length || 'Livre'}</span>}
                    </div>

                    {dayItems.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {dayItems.map((item) => (
                          <article key={item.id} className="rounded-xl border border-border bg-surface2 p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 break-words text-sm font-semibold leading-tight text-text">
                                {item.scripts?.title ?? 'Roteiro sem título'}
                              </p>
                              <button onClick={(e) => { e.stopPropagation(); deleteItem.mutateAsync(item.id) }} className="touch-target shrink-0 rounded-lg text-text-muted transition-colors hover:text-danger">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-2">
                              <Badge variant={item.platform === 'reels' ? 'ai' : item.platform === 'tiktok' ? 'primary' : 'success'}>
                                {item.platform}
                              </Badge>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop calendar — takes the main 1fr column */}
        <div className="hidden overflow-x-auto rounded-[var(--r-lg)] border border-border bg-surface md:block custom-scrollbar">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 border-b border-border bg-surface2/50">
              {weekDays.map((day) => (
                <div key={day} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-text-muted">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = toDateKey(day)
                const dayItems = itemsByDate[key] ?? []
                const outside = day.getMonth() !== cursor.getMonth()
                return (
                  <div
                    key={key}
                    onClick={() => handleDayClick(day)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverDay(key)
                    }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(event) => handleDrop(event, day)}
                    className={cn(
                      'min-h-[160px] min-w-0 border-b border-r border-border p-2 transition-all cursor-pointer hover:bg-surface2/30',
                      outside ? 'bg-surface2/20 opacity-40' : 'bg-surface',
                      dragOverDay === key ? 'bg-primary/5 ring-2 ring-inset ring-primary' : '',
                      selectedScriptId && !outside ? 'ring-2 ring-inset ring-primary/40 bg-primary/5' : ''
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={cn("text-xs font-bold", isToday(day) ? "text-primary" : "text-text-subtle")}>{day.getDate()}</span>
                      {isToday(day) && <Badge variant="success" className="px-1.5 py-0 text-[9px] h-4">Hoje</Badge>}
                    </div>
                    <div className="space-y-1.5">
                      {dayItems.map((item) => (
                        <article
                          key={item.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move'
                            event.dataTransfer.setData('application/dbe-calendar-item', item.id)
                          }}
                          className="group cursor-grab rounded-lg border border-border bg-surface2 p-2 active:cursor-grabbing hover:border-primary/40 shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="line-clamp-3 text-[10px] font-semibold leading-tight text-text">
                              {item.scripts?.title ?? 'Roteiro sem título'}
                            </p>
                            <button onClick={(e) => { e.stopPropagation(); deleteItem.mutateAsync(item.id) }} className="rounded-sm text-text-muted opacity-0 transition-all hover:text-danger group-hover:opacity-100">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                             <span className="text-[9px] font-bold uppercase text-primary/80">{item.scripts?.status ?? item.platform}</span>
                             <div className="h-1 w-1 rounded-full bg-primary/40" />
                          </div>
                        </article>
                      ))}
                      {dayItems.length === 0 && selectedScriptId && !outside && (
                        <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5">
                          <span className="text-[9px] font-medium text-primary uppercase">Agendar</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Unscheduled scripts panel — right sidebar */}
        <Card className="h-full flex flex-col p-4 bg-surface2/30 border-border">
          <div className="mb-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text">Sem data</h3>
              <p className="text-[10px] text-text-muted">Selecione ou arraste.</p>
            </div>
            <Badge variant="primary" className="h-5 px-1.5 text-[10px]">{unscheduledScripts.length}</Badge>
          </div>

          <div className="flex-1 overflow-hidden">
            {unscheduledScripts.length === 0 ? (
              <EmptyState icon={Clock} title="Tudo agendado" description="Parabéns! Sua estratégia está no ar." />
            ) : (
              <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                {unscheduledScripts.map((script) => (
                  <div
                    key={script.id}
                    draggable
                    onClick={() => setSelectedScriptId(selectedScriptId === script.id ? null : script.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('application/dbe-script', script.id)
                    }}
                    className={cn(
                      "cursor-grab rounded-xl border p-3 transition-all active:cursor-grabbing shadow-sm",
                      selectedScriptId === script.id 
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                        : "border-border bg-surface hover:border-primary/40"
                    )}
                  >
                    <p className="line-clamp-2 text-xs font-semibold text-text">{script.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-text-muted">{script.status === 'ready' ? 'Pronto' : script.status === 'approved' ? 'Aprovado' : 'Rascunho'}</span>
                      {selectedScriptId === script.id && <span className="text-[9px] font-bold text-primary animate-pulse uppercase">Selecionado</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function buildCurrentMonthDays(date: Date) {
  const start = startOfMonth(date)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return Array.from({ length: last.getDate() }, (_, index) => {
    const day = new Date(start)
    day.setDate(index + 1)
    return day
  })
}

function buildMonthGrid(date: Date) {
  const start = startOfMonth(date)
  const first = new Date(start)
  first.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(first)
    day.setDate(first.getDate() + index)
    return day
  })
}

function buildWeekGrid(date: Date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function atNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
}

function isToday(date: Date) {
  return toDateKey(date) === toDateKey(new Date())
}
