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
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-dbe-blue/10 text-dbe-blue border border-dbe-blue/20'
            : 'text-dbe-muted hover:text-dbe-text hover:bg-white/5 border border-transparent',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <Badge variant="purple" className="ml-auto text-[10px] px-1.5 py-0">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  )
}
