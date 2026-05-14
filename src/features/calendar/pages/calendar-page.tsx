import { useMemo, useState, type DragEvent } from 'react'
import { ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

export function CalendarPage() {
  const { workspaceId } = useWorkspaceContext()
  const { data: items = [], isLoading: itemsLoading } = useCalendarItems(workspaceId)
  const { data: scripts = [], isLoading: scriptsLoading } = useScripts(workspaceId)
  const createItem = useCreateCalendarItem(workspaceId)
  const updateItem = useUpdateCalendarItem(workspaceId)
  const deleteItem = useDeleteCalendarItem(workspaceId)
  const [cursor, setCursor] = useState(startOfMonth(new Date()))
  const [platform, setPlatform] = useState<CalendarPlatform | 'all'>('all')
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

  const filteredItems = platform === 'all' ? items : items.filter((item) => item.platform === platform)
  const scheduledScriptIds = new Set(items.map((item) => item.script_id).filter(Boolean))
  const unscheduledScripts = scripts.filter((script) => !scheduledScriptIds.has(script.id))
  const days = buildMonthGrid(cursor)

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

  return (
    <div>
      <PageHeader title="Calendário editorial" description="Arraste roteiros para montar sua agenda de publicação.">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCursor(addMonths(cursor, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold capitalize text-dbe-text">
          {cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex flex-wrap gap-2">
          {platforms.map((option) => (
            <button
              key={option.value}
              onClick={() => setPlatform(option.value)}
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                platform === option.value ? 'border-dbe-blue/40 bg-dbe-blue/10 text-dbe-blue' : 'border-dbe-border text-dbe-muted hover:text-dbe-text',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-dbe-text">Roteiros sem data</h3>
              <p className="text-xs text-dbe-muted">Arraste para um dia do calendário.</p>
            </div>
            <Badge variant="blue">{unscheduledScripts.length}</Badge>
          </div>

          {unscheduledScripts.length === 0 ? (
            <EmptyState icon={Clock} title="Tudo agendado" description="Todos os roteiros já possuem uma data no calendário." />
          ) : (
            <div className="space-y-2">
              {unscheduledScripts.map((script) => (
                <div
                  key={script.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('application/dbe-script', script.id)
                  }}
                  className="cursor-grab rounded-lg border border-dbe-border bg-dbe-dark/60 p-3 active:cursor-grabbing"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-dbe-text">{script.title}</p>
                  <p className="mt-1 text-xs text-dbe-muted">{script.status === 'ready' ? 'Pronto' : script.status === 'approved' ? 'Aprovado' : 'Rascunho'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="overflow-hidden rounded-xl border border-dbe-border bg-dbe-navy">
          <div className="grid grid-cols-7 border-b border-dbe-border bg-dbe-dark/50">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-dbe-muted">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-7">
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
                  className={[
                    'min-h-36 border-b border-r border-dbe-border p-2 transition-all sm:min-h-44',
                    outside ? 'bg-dbe-dark/30 opacity-55' : 'bg-dbe-navy',
                    dragOverDay === key ? 'bg-dbe-blue/10 ring-1 ring-inset ring-dbe-blue' : '',
                  ].join(' ')}
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
                        className="group cursor-grab rounded-lg border border-dbe-border bg-dbe-dark/80 p-2 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-xs font-semibold leading-snug text-dbe-text">{item.scripts?.title ?? 'Roteiro sem título'}</p>
                          <button onClick={() => deleteItem.mutateAsync(item.id)} className="text-dbe-muted opacity-0 transition-all hover:text-dbe-red group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Badge className="mt-2" variant={item.platform === 'reels' ? 'purple' : item.platform === 'tiktok' ? 'blue' : 'success'}>
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
      </div>
    </div>
  )
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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
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
