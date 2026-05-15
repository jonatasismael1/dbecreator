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

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-start border-b border-border px-5 py-5">
        <img
          src={logoDbeSrc}
          alt="DBE Creator"
          className="h-16 w-auto object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-text-muted/60 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem key={item.path} item={item} onClick={onItemClick} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-[var(--r-lg)] border border-ai/30 bg-gradient-to-r from-ai/10 via-primary/10 to-transparent p-4">
          <p className="mb-1 text-xs font-semibold text-ai">Deby AI</p>
          <p className="text-[11px] text-text-muted">Direção estratégica ativa.</p>
        </div>
      </div>
    </div>
  )
}
