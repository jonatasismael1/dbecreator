import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useTheme } from '@/hooks/use-theme'
import logoDbeSrc from '@/assets/logo-pwa-512x512.png.png'

export function Topbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    <header className="relative z-20 mx-4 md:mx-6">
      <div className="flex min-h-14 items-center justify-between gap-3">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 md:hidden">
          <img src={logoDbeSrc} alt="DBE Creator" className="h-9 w-auto object-contain" />
        </div>

        {/* Right controls */}
        <div className="glass-panel ml-auto flex items-center gap-1 rounded-[var(--r-xl)] px-1.5 py-1.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] text-text-muted transition-all hover:bg-surface2 hover:text-text"
            aria-label="Alternar tema"
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4" strokeWidth={2} />
              : <Moon className="h-4 w-4" strokeWidth={2} />
            }
          </button>

          <div className="mx-0.5 h-5 w-px bg-border" />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 rounded-[var(--r-lg)] px-1.5 py-0.5 transition-all hover:bg-surface2"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[13px] font-medium text-text leading-tight truncate max-w-[130px]">
                  {displayName.split(' ')[0]}
                </p>
                <p className="text-[10px] text-text-muted">Plano Free</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-success text-[12px] font-bold text-white shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>

            {userMenuOpen && (
              <div className="glass-panel animate-scale-in absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-[var(--r-lg)] shadow-[var(--shadow-lg)]">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-[13px] font-semibold text-text truncate">{displayName}</p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/settings') }}
                    className="w-full flex items-center gap-2.5 rounded-[var(--r-md)] px-3 py-2 text-[13px] text-text-muted hover:text-text hover:bg-surface2 transition-colors"
                  >
                    <Settings className="h-4 w-4" strokeWidth={2} />
                    Configurações
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2.5 rounded-[var(--r-md)] px-3 py-2 text-[13px] text-danger hover:bg-danger/8 transition-colors"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2} />
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
