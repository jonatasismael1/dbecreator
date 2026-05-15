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

const platforms: Array<{ value: CalendarPlatform | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'reels', label: 'Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'shorts', label: 'Shorts' },
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
  const [platform, setPlatform] = useState<CalendarPlatform | 'all'>('all')
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<MobileViewType>('week')

  const filteredItems = platform === 'all' ? items : items.filter((item) => item.platform === platform)
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
      platform: platform === 'all' ? 'reels' : platform,
    })
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
        <h2 className="text-lg font-semibold capitalize text-dbe-text">
          {displayDate}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile View Toggle */}
          <div className="md:hidden flex items-center gap-1 rounded-[var(--r-md)] border border-dbe-border bg-dbe-navy p-1 mr-2">
            <button
              onClick={() => setMobileView('week')}
              className={cn('touch-target flex items-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-1 text-xs font-medium transition-colors', mobileView === 'week' ? 'bg-dbe-blue/10 text-dbe-blue' : 'text-dbe-muted hover:text-dbe-text')}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Semana
            </button>
            <button
              onClick={() => setMobileView('month')}
              className={cn('touch-target flex items-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-1 text-xs font-medium transition-colors', mobileView === 'month' ? 'bg-dbe-blue/10 text-dbe-blue' : 'text-dbe-muted hover:text-dbe-text')}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Mês
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {platforms.map((option) => (
              <button
                key={option.value}
                onClick={() => setPlatform(option.value)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  platform === option.value ? 'border-dbe-blue/30 bg-dbe-blue/10 text-dbe-blue' : 'border-dbe-border text-dbe-muted hover:text-dbe-text',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4 md:hidden">
          {mobileView === 'week' ? (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {mobileDays.map((day) => {
                const key = toDateKey(day)
                const dayItems = itemsByDate[key] ?? []
                return (
                  <div
                    key={key}
                    onDragOver={(event) => { event.preventDefault(); setDragOverDay(key) }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(event) => handleDrop(event, day)}
                    className={cn(
                      'min-w-[280px] snap-center rounded-[var(--r-lg)] border bg-dbe-surface p-3 transition-all',
                      dragOverDay === key ? 'border-dbe-blue bg-dbe-blue/5' : 'border-dbe-border',
                      isToday(day) && 'border-dbe-green/30 bg-dbe-green/5'
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-dbe-border pb-2">
                      <div className="flex items-baseline gap-2">
                        <span className={cn("text-lg font-bold", isToday(day) ? "text-dbe-green" : "text-dbe-text")}>{day.getDate()}</span>
                        <span className="text-xs font-medium uppercase text-dbe-muted">
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                      </div>
                      {isToday(day) ? <Badge variant="success">Hoje</Badge> : <span className="text-xs text-dbe-muted">{dayItems.length || 'Livre'}</span>}
                    </div>

                    <div className="space-y-2 min-h-[100px]">
                      {dayItems.length > 0 ? dayItems.map((item) => (
                        <article
                          key={item.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move'
                            event.dataTransfer.setData('application/dbe-calendar-item', item.id)
                          }}
                          className="group rounded-[var(--r-md)] border border-dbe-border/70 bg-dbe-dark/70 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 break-words text-sm font-semibold leading-snug text-dbe-text">
                              {item.scripts?.title ?? 'Roteiro sem título'}
                            </p>
                            <button onClick={() => deleteItem.mutateAsync(item.id)} className="touch-target shrink-0 rounded-[var(--r-sm)] text-dbe-muted transition-colors hover:bg-dbe-red/10 hover:text-dbe-red">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <Badge className="mt-2" variant={item.platform === 'reels' ? 'ai' : item.platform === 'tiktok' ? 'primary' : 'success'}>
                            {item.platform}
                          </Badge>
                        </article>
                      )) : (
                        <div className="flex h-full min-h-[100px] items-center justify-center rounded-lg border border-dashed border-dbe-border/50 text-xs text-dbe-muted">
                          Arraste roteiros aqui
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {mobileDays.map((day) => {
                const key = toDateKey(day)
                const dayItems = itemsByDate[key] ?? []
                return (
                  <div
                    key={key}
                    onDragOver={(event) => { event.preventDefault(); setDragOverDay(key) }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(event) => handleDrop(event, day)}
                    className={cn(
                      'rounded-[var(--r-lg)] border bg-dbe-surface p-3 transition-all',
                      dragOverDay === key ? 'border-dbe-blue bg-dbe-blue/5' : 'border-dbe-border',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-dbe-text">{day.getDate()}</span>
                        <span className="text-xs font-medium uppercase text-dbe-muted">
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                      </div>
                      {isToday(day) ? <Badge variant="success">Hoje</Badge> : <span className="text-xs text-dbe-muted">{dayItems.length || 'Livre'}</span>}
                    </div>

                    {dayItems.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {dayItems.map((item) => (
                          <article key={item.id} className="rounded-[var(--r-md)] border border-dbe-border/70 bg-dbe-dark/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 break-words text-sm font-semibold leading-snug text-dbe-text">
                                {item.scripts?.title ?? 'Roteiro sem título'}
                              </p>
                              <button onClick={() => deleteItem.mutateAsync(item.id)} className="touch-target shrink-0 rounded-[var(--r-sm)] text-dbe-muted transition-colors hover:bg-dbe-red/10 hover:text-dbe-red">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <Badge className="mt-2" variant={item.platform === 'reels' ? 'ai' : item.platform === 'tiktok' ? 'primary' : 'success'}>
                              {item.platform}
                            </Badge>
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

        <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-dbe-border bg-dbe-surface md:block">
          <div className="grid grid-cols-7 border-b border-dbe-border bg-dbe-dark/50">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-dbe-muted">{day}</div>
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
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOverDay(key)
                  }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={(event) => handleDrop(event, day)}
                  className={cn(
                    'min-h-44 min-w-0 border-b border-r border-dbe-border p-2 transition-all',
                    outside ? 'bg-dbe-dark/30 opacity-55' : 'bg-dbe-surface',
                    dragOverDay === key ? 'bg-dbe-blue/5 ring-1 ring-inset ring-dbe-blue' : '',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-dbe-muted">{day.getDate()}</span>
                    {isToday(day) && <Badge variant="success">Hoje</Badge>}
                  </div>
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <article
                        key={item.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('application/dbe-calendar-item', item.id)
                        }}
                        className="group cursor-grab rounded-[var(--r-md)] border border-dbe-border bg-dbe-dark/80 p-2 active:cursor-grabbing hover:border-dbe-blue/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-xs font-semibold leading-snug text-dbe-text">{item.scripts?.title ?? 'Roteiro sem título'}</p>
                          <button onClick={() => deleteItem.mutateAsync(item.id)} className="touch-target rounded-[var(--r-sm)] text-dbe-muted opacity-0 transition-all hover:text-dbe-red group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Badge className="mt-2" variant={item.platform === 'reels' ? 'ai' : item.platform === 'tiktok' ? 'primary' : 'success'}>
                          {item.platform}
                        </Badge>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unscheduled scripts panel - on mobile, appears below the calendar */}
        <Card className="h-fit">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-dbe-text">Roteiros sem data</h3>
              <p className="text-xs text-dbe-muted">Arraste para o calendário.</p>
            </div>
            <Badge variant="blue">{unscheduledScripts.length}</Badge>
          </div>

          {unscheduledScripts.length === 0 ? (
            <EmptyState icon={Clock} title="Tudo agendado" description="Todos os roteiros já possuem uma data no calendário." />
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {unscheduledScripts.map((script) => (
                <div
                  key={script.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('application/dbe-script', script.id)
                  }}
                  className="cursor-grab rounded-[var(--r-md)] border border-dbe-border bg-dbe-dark/60 p-3 active:cursor-grabbing hover:border-dbe-blue/40 transition-colors"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-dbe-text">{script.title}</p>
                  <p className="mt-1 text-xs text-dbe-muted">{script.status === 'ready' ? 'Pronto' : script.status === 'approved' ? 'Aprovado' : 'Rascunho'}</p>
                </div>
              ))}
            </div>
          )}
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
