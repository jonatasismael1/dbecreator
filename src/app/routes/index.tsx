import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/app/layout/auth-layout'
import { LoadingState } from '@/components/shared/loading-state'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/components/route-guards'
import {
  ApprovalsPage,
  CalendarPage,
  CampaignsPage,
  DashboardPage,
  DebyPage,
  EmailConfirmationPage,
  IdeasPage,
  LoginPage,
  MarketMapPage,
  MaterialsPage,
  PillarsPage,
  PublicApprovalPage,
  PublicBatchApprovalPage,
  RegisterPage,
  ReportsPage,
  ScriptPreviewPage,
  ScriptsPage,
  SettingsPage,
  TeleprompterPage,
} from './lazy-pages'

function routePage(element: ReactNode) {
  return <Suspense fallback={<LoadingState />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: routePage(<LoginPage />) },
          { path: '/register', element: routePage(<RegisterPage />) },
        ],
      },
    ],
  },
  { path: '/auth/callback', element: routePage(<EmailConfirmationPage />) },
  { path: '/confirmacao-email', element: routePage(<EmailConfirmationPage />) },
  { path: '/approval/:token', element: routePage(<PublicApprovalPage />) },
  { path: '/aprovacao/:token', element: routePage(<PublicApprovalPage />) },
  { path: '/aprovacao/lote/:token', element: routePage(<PublicBatchApprovalPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: routePage(<DashboardPage />) },
          { path: '/ideas', element: routePage(<IdeasPage />) },
          { path: '/market-map', element: routePage(<MarketMapPage />) },
          { path: '/pillars', element: routePage(<PillarsPage />) },
          { path: '/scripts', element: routePage(<ScriptsPage />) },
          { path: '/scripts/:scriptId', element: routePage(<ScriptPreviewPage />) },
          { path: '/materials', element: routePage(<MaterialsPage />) },
          { path: '/deby', element: routePage(<DebyPage />) },
          { path: '/calendar', element: routePage(<CalendarPage />) },
          { path: '/campaigns', element: routePage(<CampaignsPage />) },
          { path: '/teleprompter', element: routePage(<TeleprompterPage />) },
          { path: '/teleprompter/:scriptId', element: routePage(<TeleprompterPage />) },
          { path: '/approvals', element: routePage(<ApprovalsPage />) },
          { path: '/reports', element: routePage(<ReportsPage />) },
          { path: '/settings', element: routePage(<SettingsPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
