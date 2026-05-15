import {
  LayoutDashboard,
  Lightbulb,
  FolderOpen,
  Map,
  Columns3,
  FileText,
  Sparkles,
  CalendarDays,
  Megaphone,
  MonitorPlay,
  UserCheck,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Geral',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Criação',
    items: [
      { label: 'Ideias', path: '/ideas', icon: Lightbulb },
      { label: 'Materiais', path: '/materials', icon: FolderOpen },
      { label: 'Roteiros', path: '/scripts', icon: FileText },
    ],
  },
  {
    title: 'Estratégia',
    items: [
      { label: 'Mapa de Mercado', path: '/market-map', icon: Map },
      { label: 'Pilares', path: '/pillars', icon: Columns3 },
      { label: 'Deby AI', path: '/deby', icon: Sparkles, badge: 'AI' },
    ],
  },
  {
    title: 'Produção',
    items: [
      { label: 'Calendário', path: '/calendar', icon: CalendarDays },
      { label: 'Campanhas', path: '/campaigns', icon: Megaphone },
      { label: 'Teleprompter', path: '/teleprompter', icon: MonitorPlay },
      { label: 'Aprovações', path: '/approvals', icon: UserCheck },
    ],
  },
  {
    title: 'Resultados',
    items: [
      { label: 'Relatórios', path: '/reports', icon: BarChart3 },
      { label: 'Configurações', path: '/settings', icon: Settings },
    ],
  },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Roteiros', path: '/scripts', icon: FileText },
  { label: 'CalendÃ¡rio', path: '/calendar', icon: CalendarDays },
  { label: 'Deby AI', path: '/deby', icon: Sparkles, badge: 'AI' },
]
