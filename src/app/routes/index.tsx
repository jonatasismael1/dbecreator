import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/app/layout/auth-layout'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/components/route-guards'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { EmailConfirmationPage } from '@/features/auth/pages/email-confirmation-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { IdeasPage } from '@/features/ideas/pages/ideas-page'
import { MarketMapPage } from '@/features/market-map/pages/market-map-page'
import { PillarsPage } from '@/features/pillars/pages/pillars-page'
import { ScriptsPage } from '@/features/scripts/pages/scripts-page'
import { ScriptPreviewPage } from '@/features/scripts/pages/script-preview-page'
import { TeleprompterPage } from '@/features/teleprompter/pages/teleprompter-page'
import { DebyPage } from '@/features/deby/pages/deby-page'
import { CalendarPage } from '@/features/calendar/pages/calendar-page'
import { MaterialsPage } from '@/features/materials/pages/materials-page'
import { SettingsPage } from '@/features/settings/pages/settings-page'
import { CampaignsPage } from '@/features/campaigns/pages/campaigns-page'
import { ApprovalsPage } from '@/features/approvals/pages/approvals-page'
import { PublicApprovalPage } from '@/features/approvals/pages/public-approval-page'
import { PublicBatchApprovalPage } from '@/features/approvals/pages/public-batch-approval-page'
import { ReportsPage } from '@/features/reports/pages/reports-page'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  { path: '/auth/callback', element: <EmailConfirmationPage /> },
  { path: '/confirmacao-email', element: <EmailConfirmationPage /> },
  { path: '/approval/:token', element: <PublicApprovalPage /> },
  { path: '/aprovacao/:token', element: <PublicApprovalPage /> },
  { path: '/aprovacao/lote/:token', element: <PublicBatchApprovalPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/ideas', element: <IdeasPage /> },
          { path: '/market-map', element: <MarketMapPage /> },
          { path: '/pillars', element: <PillarsPage /> },
          { path: '/scripts', element: <ScriptsPage /> },
          { path: '/scripts/:scriptId', element: <ScriptPreviewPage /> },
          { path: '/materials', element: <MaterialsPage /> },
          { path: '/deby', element: <DebyPage /> },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/campaigns', element: <CampaignsPage /> },
          { path: '/teleprompter', element: <TeleprompterPage /> },
          { path: '/teleprompter/:scriptId', element: <TeleprompterPage /> },
          { path: '/approvals', element: <ApprovalsPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
