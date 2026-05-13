/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useWorkspace } from '@/features/workspaces/hooks/use-workspace'
import { LoadingState } from '@/components/shared/loading-state'

interface WorkspaceContextValue {
  workspaceId: string
  workspaceName: string
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: workspace, isLoading, isError } = useWorkspace()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dbe-dark flex items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (isError || !workspace) {
    return (
      <div className="min-h-screen bg-dbe-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-dbe-red font-medium">Erro ao carregar workspace.</p>
          <p className="text-dbe-muted text-sm mt-1">Recarregue a página ou contate o suporte.</p>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceContext.Provider value={{ workspaceId: workspace.id, workspaceName: workspace.name }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspaceContext must be used within WorkspaceProvider')
  return ctx
}
