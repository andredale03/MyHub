import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AdminPage from './AdminPage.tsx'
import AppFrame from './AppFrame.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import RequireAccess from './auth/RequireAccess.tsx'
import LoginPage from './auth/LoginPage.tsx'
import AccountPage from './auth/AccountPage.tsx'

// Le app figlie sono caricate in lazy: il loro bundle (incluso Recharts)
// non pesa sul caricamento iniziale dell'hub.
const PayStats = lazy(() => import('./apps/paystats'))
const Gymode = lazy(() => import('./apps/gymode'))

function AppFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="text-sm text-surface-400">Caricamento…</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route
            path="/app/paystats"
            element={
              <RequireAccess appId="paystats">
                <AppFrame>
                  <Suspense fallback={<AppFallback />}>
                    <PayStats />
                  </Suspense>
                </AppFrame>
              </RequireAccess>
            }
          />
          <Route
            path="/app/gymode"
            element={
              <RequireAccess appId="gymode">
                <AppFrame>
                  <Suspense fallback={<AppFallback />}>
                    <Gymode />
                  </Suspense>
                </AppFrame>
              </RequireAccess>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
