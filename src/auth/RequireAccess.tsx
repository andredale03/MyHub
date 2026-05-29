import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { authBypass } from '../lib/supabase'

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-sm text-zinc-400">Verifica accesso…</div>
    </div>
  )
}

/**
 * Protegge una route app:
 *  - modalità demo (Supabase non configurato) → accesso libero
 *  - VITE_AUTH_BYPASS=true (sviluppo) → accesso libero senza login/abbonamento
 *  - non autenticato → redirect a /login
 *  - autenticato senza abbonamento attivo → redirect a /account
 */
export default function RequireAccess({
  appId,
  children,
}: {
  appId: string
  children: ReactNode
}) {
  const { configured, loading, user, hasAccess } = useAuth()
  const location = useLocation()

  if (!configured || authBypass) return <>{children}</>
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!hasAccess(appId)) return <Navigate to="/account" replace />

  return <>{children}</>
}
