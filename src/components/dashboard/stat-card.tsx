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
    bg: 'bg-dbe-purple/10',
    text: 'text-dbe-purple',
    border: 'border-dbe-purple/20',
  },
  amber: {
    bg: 'bg-dbe-amber/10',
    text: 'text-dbe-amber',
    border: 'border-dbe-amber/20',
  },
}

export function StatCard({ title, value, icon: Icon, trend, accent = 'blue' }: StatCardProps) {
  const colors = accentColors[accent]

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dbe-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-dbe-text tracking-tight">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.positive ? 'text-dbe-green' : 'text-dbe-red')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3 border', colors.bg, colors.border)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
      </div>
      {/* Decorative gradient line */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-50', `bg-gradient-to-r from-transparent via-current to-transparent`, colors.text)} />
    </Card>
  )
}
