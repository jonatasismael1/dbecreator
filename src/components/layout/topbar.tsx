import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useTheme } from '@/hooks/use-theme'
import logoDbeSrc from '@/assets/logo-pwa-512x512.png.png'

export function Topbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ').map((n: string) => n[0]).slice(0, 2).join('')
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Usuário'

  return (
    <header className="relative z-20 mx-4 md:mx-8">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="flex items-center gap-4 md:hidden">
          <img src={logoDbeSrc} alt="DBE Creator" className="h-10 w-auto object-contain" />
        </div>

        <div className="glass-panel ml-auto flex items-center gap-2 rounded-[var(--r-xl)] px-2 py-1.5">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="touch-target relative rounded-[var(--r-md)] p-2 text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" strokeWidth={2.5} /> : <Moon className="h-5 w-5" strokeWidth={2.5} />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex touch-target items-center gap-3 border-l border-border pl-2 transition-opacity hover:opacity-90 sm:pl-3"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-text truncate max-w-[140px]">{displayName}</p>
                <p className="text-[11px] text-text-muted">Plano Free</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-gradient-to-br from-primary to-success text-sm font-bold text-white">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>

            {userMenuOpen && (
              <div className="glass-panel absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-[var(--r-lg)]">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-text truncate">{displayName}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/settings') }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger-soft transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
