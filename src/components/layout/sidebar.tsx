import logoDbeSrc from '@/assets/logo-pwa-512x512.png.png'
import { NAV_SECTIONS } from '@/lib/constants/navigation'
import { SidebarItem } from './sidebar-item'

export function Sidebar() {
  return (
    <aside className="glass-panel hidden overflow-hidden md:fixed md:bottom-4 md:left-4 md:top-4 md:z-30 md:flex md:w-64 md:flex-col md:rounded-[var(--r-xl)]">
      <SidebarContent />
    </aside>
  )
}

export function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="relative flex items-center justify-start px-5 pt-5 pb-4">
        <img
          src={logoDbeSrc}
          alt="DBE Creator"
          className="h-14 w-auto object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-text-subtle/70 uppercase tracking-[0.18em]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem key={item.path} item={item} onClick={onItemClick} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Deby AI Footer */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-[var(--r-lg)] bg-gradient-to-br from-primary/15 via-surface2 to-success/10 p-4 border border-primary/15">
          {/* Background glow */}
          <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-success/20 blur-xl" />
          <div className="pointer-events-none absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-primary/20 blur-lg" />

          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-xs font-semibold text-success tracking-wide">Deby AI</p>
            </div>
            <p className="text-[11px] leading-relaxed text-text-muted">
              Direção estratégica ativa para o seu conteúdo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
