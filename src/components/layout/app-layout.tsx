import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { WorkspaceProvider } from '@/features/workspaces/context/workspace-context'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-background/80 transition-colors duration-300">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-72 pt-4">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  )
}
