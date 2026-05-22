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
          'group flex items-center gap-2.5 rounded-[var(--r-md)] px-2.5 py-2 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-primary/12 text-text [&>svg]:text-primary'
            : 'text-text-muted hover:bg-surface2 hover:text-text',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'h-[17px] w-[17px] shrink-0 transition-colors duration-150',
              isActive ? 'text-primary' : 'text-text-muted group-hover:text-text'
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="ai" className="ml-auto text-[9px] font-bold px-1.5 py-0 uppercase tracking-tight">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}
