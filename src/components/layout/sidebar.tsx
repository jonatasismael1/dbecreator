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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:rounded-2xl bg-dbe-navy/80 backdrop-blur-xl border border-dbe-border z-30 shadow-sm transition-colors duration-300 overflow-hidden">
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
              className="fixed inset-y-0 left-0 w-72 bg-dbe-navy border-r border-dbe-border z-50 lg:hidden"
            >
              <div className="flex items-center justify-end p-4">
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-dbe-muted hover:text-dbe-text hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
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
      <div className="flex items-center gap-3 px-6 py-5 border-b border-dbe-border">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-dbe-blue to-dbe-purple">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-display text-dbe-text tracking-tight">DBE Creator</h1>
          <p className="text-[10px] text-dbe-muted uppercase tracking-widest">Content OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-dbe-muted/60 uppercase tracking-wider">
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
      <div className="p-4 border-t border-dbe-border">
        <div className="rounded-xl bg-gradient-to-r from-dbe-purple/10 to-dbe-blue/10 border border-dbe-purple/20 p-4">
          <p className="text-xs font-semibold text-dbe-purple mb-1">Deby IA</p>
          <p className="text-[11px] text-dbe-muted">Sua diretora de conteúdo está pronta.</p>
        </div>
      </div>
    </div>
  )
}
