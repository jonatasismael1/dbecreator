import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Search, LogOut, User, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useTheme } from '@/hooks/use-theme'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
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
    <header className="sticky top-4 z-20 mx-4 lg:mx-8 bg-dbe-navy/80 backdrop-blur-xl border border-dbe-border rounded-2xl transition-colors duration-300 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden rounded-lg p-2 text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-dbe-navy border border-dbe-border rounded-lg px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-dbe-blue/50 transition-all">
            <Search className="h-4 w-4 text-dbe-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent text-sm text-dbe-text placeholder:text-dbe-muted/50 outline-none w-full"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative rounded-lg p-2 text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="relative rounded-lg p-2 text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 pl-3 border-l border-dbe-border hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-dbe-text truncate max-w-[140px]">{displayName}</p>
                <p className="text-[11px] text-dbe-muted">Plano Free</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-dbe-blue to-dbe-purple flex items-center justify-center text-sm font-bold text-white overflow-hidden border border-dbe-border/50">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-52 rounded-xl bg-dbe-navy border border-dbe-border shadow-xl shadow-black/30 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-dbe-border">
                  <p className="text-sm font-medium text-dbe-text truncate">{displayName}</p>
                  <p className="text-xs text-dbe-muted truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <User className="h-4 w-4" />
                    Perfil
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-dbe-red hover:bg-dbe-red/10 transition-colors"
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
