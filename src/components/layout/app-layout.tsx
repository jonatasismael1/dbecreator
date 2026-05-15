import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { BottomNav } from './bottom-nav'
import { WorkspaceProvider } from '@/features/workspaces/context/workspace-context'

export function AppLayout() {
  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-background/80 transition-colors duration-300">
        <Sidebar />

        <div className="pt-3 md:pl-72 md:pt-4">
          <Topbar />

          <main className="px-4 pb-28 pt-4 md:p-8">
            <Outlet />
          </main>
        </div>

        <BottomNav />
      </div>
    </WorkspaceProvider>
  )
}
