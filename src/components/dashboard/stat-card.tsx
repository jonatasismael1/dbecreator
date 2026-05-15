import { type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  accent?: 'blue' | 'green' | 'purple' | 'amber'
}

const accentColors = {
  blue: {
    bg: 'bg-dbe-blue/10',
    text: 'text-dbe-blue',
    border: 'border-dbe-blue/20',
  },
  green: {
    bg: 'bg-dbe-green/10',
    text: 'text-dbe-green',
    border: 'border-dbe-green/20',
  },
  purple: {
    bg: 'bg-dbe-green/10',
    text: 'text-dbe-green',
    border: 'border-dbe-green/25',
  },
  amber: {
    bg: 'bg-dbe-blue/10',
    text: 'text-dbe-blue',
    border: 'border-dbe-blue/25',
  },
}

export function StatCard({ title, value, icon: Icon, trend, accent = 'blue' }: StatCardProps) {
  const colors = accentColors[accent]

  return (
    <Card className="relative overflow-hidden">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-dbe-muted mb-1">{title}</p>
          <p className="truncate text-3xl font-bold text-dbe-text tracking-tight">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.positive ? 'text-dbe-green' : 'text-dbe-red')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('shrink-0 rounded-[var(--r-lg)] p-3 border', colors.bg, colors.border)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
      </div>
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-60', `bg-gradient-to-r from-transparent via-current to-transparent`, colors.text)} />
    </Card>
  )
}
