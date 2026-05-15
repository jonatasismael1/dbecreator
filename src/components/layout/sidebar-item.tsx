import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import type { NavItem } from '@/lib/constants/navigation'

interface SidebarItemProps {
  item: NavItem
  collapsed?: boolean
  onClick?: () => void
}

export function SidebarItem({ item, collapsed = false, onClick }: SidebarItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-200',
          isActive
            ? 'border-primary/20 bg-surface2 text-text shadow-sm [&>svg]:text-primary'
            : 'border-transparent text-text-muted hover:bg-surface2 hover:text-text',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <Badge variant="ai" className="ml-auto text-[9px] font-bold px-1 py-0 uppercase tracking-tighter">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  )
}
