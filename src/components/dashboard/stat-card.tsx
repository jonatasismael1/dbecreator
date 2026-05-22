import { type LucideIcon } from 'lucide-react'
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

const accentMap = {
  primary: {
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    accentLine: 'from-primary/0 via-primary/50 to-primary/0',
    cardHover: 'hover:border-primary/30 hover:shadow-[0_4px_24px_rgb(var(--blue-rgb)/0.12)]',
  },
  success: {
    iconBg: 'bg-success/12',
    iconColor: 'text-success',
    accentLine: 'from-success/0 via-success/50 to-success/0',
    cardHover: 'hover:border-success/30 hover:shadow-[0_4px_24px_rgb(var(--green-rgb)/0.12)]',
  },
  blue: {
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    accentLine: 'from-primary/0 via-primary/50 to-primary/0',
    cardHover: 'hover:border-primary/30 hover:shadow-[0_4px_24px_rgb(var(--blue-rgb)/0.12)]',
  },
  green: {
    iconBg: 'bg-success/12',
    iconColor: 'text-success',
    accentLine: 'from-success/0 via-success/50 to-success/0',
    cardHover: 'hover:border-success/30 hover:shadow-[0_4px_24px_rgb(var(--green-rgb)/0.12)]',
  },
}

export function StatCard({ title, value, icon: Icon, trend, accent = 'primary', onClick }: StatCardProps) {
  const colors = accentMap[accent] ?? accentMap.primary
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      className={cn(
        'relative w-full text-left overflow-hidden rounded-[var(--r-lg)] glass-panel p-5 transition-all duration-200',
        onClick && cn('cursor-pointer active:scale-[0.98]', colors.cardHover)
      )}
      onClick={onClick as React.MouseEventHandler | undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text-muted mb-1.5 tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-text tracking-tight tabular-nums">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-semibold flex items-center gap-0.5', trend.positive ? 'text-success' : 'text-danger')}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className={cn('shrink-0 rounded-xl p-2.5', colors.iconBg)}>
          <Icon className={cn('h-5 w-5', colors.iconColor)} strokeWidth={2} />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60', colors.accentLine)} />
    </Wrapper>
  )
}
