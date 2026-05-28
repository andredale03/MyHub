import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LayoutGrid, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const { configured, signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const submit = async () => {
    setError(null)
    setInfo(null)
    if (!email.trim() || !password) {
      setError('Inserisci email e password.')
      return
    }
    setBusy(true)
    const fn = mode === 'signin' ? signInWithPassword : signUp
    const { error } = await fn(email.trim(), password)
    setBusy(false)
    if (error) { setError(error); return }
    if (mode === 'signup') {
      setInfo('Registrazione completata. Controlla la mail se è richiesta la conferma, poi accedi.')
      setMode('signin')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">
            My Hub
          </span>
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {mode === 'signin' ? 'Accedi' : 'Crea un account'}
          </h1>
          <p className="text-sm text-zinc-400 mb-5">
            {mode === 'signin'
              ? 'Entra per accedere alle tue app.'
              : 'Registrati per iniziare la prova.'}
          </p>

          {!configured && (
            <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              Supabase non è ancora configurato: il login non è attivo. L'hub gira in modalità demo.
            </div>
          )}

          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Email</label>
          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
            />
          </div>

          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Password</label>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          {info && <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">{info}</p>}

          <button
            onClick={submit}
            disabled={busy || !configured}
            className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {mode === 'signin' ? 'Accedi' : 'Registrati'}
          </button>

          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null) }}
            className="w-full mt-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-1"
          >
            {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>
      </div>
    </div>
  )
}
