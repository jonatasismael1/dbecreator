import { Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-dbe-dark">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-dbe-blue/18 via-dbe-green/8 to-dbe-dark" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-dbe-blue/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-dbe-green/6 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--r-xl)] bg-gradient-to-br from-dbe-blue to-dbe-green shadow-[0_0_28px_rgba(0,191,85,0.18)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-dbe-text">DBE Creator</h1>
          </div>

          <h2 className="mb-4 max-w-xl text-[40px] font-bold leading-[1.05] tracking-[-0.8px] text-dbe-text">
            Transforme ideias em{' '}
            <span className="text-dbe-blue">Reels</span>{' '}
            <span className="text-dbe-green">que vendem.</span>
          </h2>

          <p className="max-w-md text-lg text-dbe-muted">
            O sistema operacional para criadores de conteudo estrategico. Da ideia a performance, com a inteligencia da Deby.
          </p>

          <div className="mt-12 flex items-center gap-8 text-sm text-dbe-muted">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dbe-green" />
              <span>AI Estrategica</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dbe-blue" />
              <span>Multi-Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dbe-green" />
              <span>Roteiros Pro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--r-lg)] bg-gradient-to-br from-dbe-blue to-dbe-green">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-dbe-text">DBE Creator</h1>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
