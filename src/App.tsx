import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { FlowProvider } from './app/FlowContext'
import { AppShell } from './components/AppShell'
import { AboutPage } from './routes/AboutPage'
import { ConditionPage } from './routes/ConditionPage'
import { ConfirmPage } from './routes/ConfirmPage'
import { ErrorPage } from './routes/ErrorPage'
import { HistoryPage } from './routes/HistoryPage'
import { LandingPage } from './routes/LandingPage'
import { PreviewPage } from './routes/PreviewPage'
import { ResultPage } from './routes/ResultPage'
import { ReusePage } from './routes/ReusePage'
import { ScanPage } from './routes/ScanPage'
import { SearchPage } from './routes/SearchPage'
import { DevStatsPage } from './routes/DevStatsPage'
import { EcoTipsPage } from './routes/EcoTipsPage'

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'scan', element: <ScanPage /> },
      { path: 'scan/preview', element: <PreviewPage /> },
      { path: 'scan/error', element: <ErrorPage /> },
      { path: 'confirm', element: <ConfirmPage /> },
      { path: 'condition', element: <ConditionPage /> },
      { path: 'result', element: <ResultPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'eco-tips', element: <EcoTipsPage /> },
      { path: 'eco-tips/:id', element: <ReusePage /> },
      { path: 'reuse/:id', element: <ReusePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  if (/\/devstats\/?$/.test(window.location.pathname)) {
    return <DevStatsPage />
  }

  return (
    <FlowProvider>
      <RouterProvider router={router} />
    </FlowProvider>
  )
}
