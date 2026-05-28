import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, LayoutGrid, LogOut, Check, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import { startCheckout } from '../lib/billing'

export default function AccountPage() {
  const { configured, loading, user, profile, subscriptionActive, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkoutResult = searchParams.get('checkout')

  // Al ritorno da Stripe (?checkout=success) il webhook potrebbe aver già
  // aggiornato il profilo: facciamo un refresh e ripuliamo l'URL.
  // Riprova qualche volta perché il webhook è asincrono.
  const refreshedRef = useRef(false)
  useEffect(() => {
    if (checkoutResult !== 'success' || refreshedRef.current) return
    refreshedRef.current = true
    let cancelled = false
    const attempts = [0, 1500, 3500]
    attempts.forEach((delay) => {
      setTimeout(() => { if (!cancelled) void refreshProfile() }, delay)
    })
    return () => { cancelled = true }
  }, [checkoutResult, refreshProfile])

  const handleCheckout = async () => {
    setError(null)
    setCheckoutLoading(true)
    try {
      await startCheckout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setCheckoutLoading(false)
    }
  }

  const dismissBanner = () => {
    searchParams.delete('checkout')
    setSearchParams(searchParams, { replace: true })
  }

  // In modalità demo non c'è account da mostrare.
  if (!configured) return <Navigate to="/" replace />
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Caricamento…</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  const renewal = profile?.subscription_current_period_end
    ? new Date(profile.subscription_current_period_end).toLocaleDateString('it-IT')
    : null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Account</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Esito ritorno da Stripe */}
        {checkoutResult === 'success' && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-sm text-emerald-700 dark:text-emerald-300">
              Pagamento completato! L'abbonamento sarà attivo entro pochi secondi.
              <button onClick={dismissBanner} className="ml-2 underline underline-offset-2 hover:no-underline">Ok</button>
            </div>
          </div>
        )}
        {checkoutResult === 'cancel' && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-start justify-between gap-2">
            <span>Pagamento annullato. Puoi attivare l'abbonamento quando vuoi.</span>
            <button onClick={dismissBanner} className="underline underline-offset-2 hover:no-underline shrink-0">Ok</button>
          </div>
        )}

        {/* Profilo */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Email</p>
          <p className="text-sm text-zinc-900 dark:text-zinc-100">{user.email}</p>
        </section>

        {/* Abbonamento */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Abbonamento</h2>
          </div>

          {subscriptionActive ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              Attivo{renewal ? ` · rinnovo il ${renewal}` : ''} — hai accesso a tutte le app.
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Con un unico abbonamento sblocchi tutte le app dell'hub. Qualità curata, non quantità.
              </p>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Reindirizzamento…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Attiva abbonamento</>
                )}
              </button>
              {error && (
                <p className="text-sm text-red-500 mt-3">{error}</p>
              )}
              <p className="text-xs text-zinc-400 mt-3">
                Verrai reindirizzato al pagamento sicuro gestito da Stripe.
              </p>
            </>
          )}
        </section>

        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <LayoutGrid className="w-4 h-4" /> Vai all'hub
          </Link>
          <button
            onClick={async () => { await signOut(); navigate('/') }}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </main>
    </div>
  )
}
