import { Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-dbe-dark flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dbe-blue/20 via-dbe-purple/10 to-dbe-dark" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-dbe-blue/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-dbe-purple/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-dbe-blue to-dbe-purple">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-dbe-text">DBE Creator</h1>
          </div>

          <h2 className="text-4xl font-bold text-dbe-text leading-tight mb-4">
            Transforme ideias em
            <span className="bg-gradient-to-r from-dbe-blue to-dbe-purple bg-clip-text text-transparent"> Reels que vendem.</span>
          </h2>

          <p className="text-lg text-dbe-muted max-w-md">
            O sistema operacional para criadores de conteúdo estratégico. Da ideia à performance, com a inteligência da Deby.
          </p>

          <div className="flex items-center gap-8 mt-12 text-sm text-dbe-muted">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dbe-green" />
              <span>IA Estratégica</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dbe-blue" />
              <span>Multi-Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dbe-purple" />
              <span>Roteiros Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-dbe-blue to-dbe-purple">
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
