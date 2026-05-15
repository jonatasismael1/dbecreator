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
  accent?: 'primary' | 'success' | 'blue' | 'green'
  onClick?: () => void
}

const accentColors = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
  blue: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  green: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
}

export function StatCard({ title, value, icon: Icon, trend, accent = 'primary', onClick }: StatCardProps) {
  const colors = accentColors[accent as keyof typeof accentColors] || accentColors.primary

  const Component = onClick ? 'button' : 'div'

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all border-border',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <Component className="w-full text-left p-4 sm:p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-text-muted mb-1 font-medium">{title}</p>
            <p className="truncate text-3xl font-bold text-text tracking-tight">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 font-medium', trend.positive ? 'text-success' : 'text-danger')}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={cn('shrink-0 rounded-2xl p-3 border shadow-sm', colors.bg, colors.border)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
        </div>
        <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-40', `bg-gradient-to-r from-transparent via-current to-transparent`, colors.text)} />
      </Component>
    </Card>
  )
}
