import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, SidebarContent } from './sidebar'
import { Topbar } from './topbar'
import { BottomNav } from './bottom-nav'
import { WorkspaceProvider } from '@/features/workspaces/context/workspace-context'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-background/80 transition-colors duration-300">
        <Sidebar />

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-[280px] bg-surface shadow-2xl md:hidden"
              >
                <div className="relative h-full flex flex-col">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute right-4 top-5 z-10 rounded-full p-2 text-text-muted hover:bg-surface2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <SidebarContent onItemClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="pt-3 md:pl-72 md:pt-4">
          <Topbar />

          <main className="px-4 pb-28 pt-4 md:p-8">
            <Outlet />
          </main>
        </div>

        <BottomNav onMoreClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </WorkspaceProvider>
  )
}
