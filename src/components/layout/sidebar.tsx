import { Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_SECTIONS } from '@/lib/constants/navigation'
import { SidebarItem } from './sidebar-item'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="glass-panel hidden overflow-hidden lg:fixed lg:bottom-4 lg:left-4 lg:top-4 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:rounded-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-panel fixed inset-y-0 left-0 z-50 w-72 rounded-r-2xl border-r border-border lg:hidden"
            >
              <div className="flex items-center justify-end p-4">
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <SidebarContent onItemClick={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-info to-ai shadow-lg shadow-primary/20 ring-1 ring-white/10">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold font-display text-text tracking-tight">DBE Creator</h1>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Content OS</p>
        </div>
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
        <div className="rounded-xl border border-ai/20 bg-gradient-to-r from-ai/10 via-primary/10 to-transparent p-4">
          <p className="mb-1 text-xs font-semibold text-ai">Deby IA</p>
          <p className="text-[11px] text-text-muted">Direção estratégica ativa.</p>
        </div>
      </div>
    </div>
  )
}
