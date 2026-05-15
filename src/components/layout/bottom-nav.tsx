import { NavLink } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils/cn'

import { Menu } from 'lucide-react'

export function BottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[var(--r-xl)] border border-border bg-surface p-1.5 shadow-2xl shadow-black/35 backdrop-blur-xl md:hidden"
      aria-label="Navegação principal"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'touch-target flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--r-md)] px-1.5 py-1 text-[10px] font-semibold leading-none text-text-muted transition-all',
                isActive
                  ? 'border border-primary/45 bg-primary/12 text-text shadow-sm shadow-primary/10 [&>svg]:text-primary'
                  : 'border border-transparent hover:bg-surface-muted/80 hover:text-text'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2.4} />
            <span className="w-full truncate text-center">{item.label}</span>
          </NavLink>
        )
      })}

      <button
        onClick={onMoreClick}
        className="touch-target flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--r-md)] border border-transparent px-1.5 py-1 text-[10px] font-semibold leading-none text-text-muted transition-all hover:bg-surface-muted/80 hover:text-text"
      >
        <Menu className="h-5 w-5 shrink-0" strokeWidth={2.4} />
        <span className="w-full truncate text-center">Mais</span>
      </button>
    </nav>
  )
}
