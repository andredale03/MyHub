import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, ExternalLink, ArrowRight, LayoutGrid, Settings, UserCircle } from 'lucide-react'
import { loadApps, fetchApps, type AppEntry } from './storage'
import { useAuth } from './auth/AuthContext'
import { useTheme } from './lib/theme'

const statusLabel: Record<AppEntry['status'], { label: string; classes: string }> = {
  live:    { label: 'Live',         classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  wip:     { label: 'In corso',     classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  planned: { label: 'Pianificata',  classes: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
}

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme()
  // Mostra subito la cache locale, poi aggiorna dal catalogo Supabase se presente.
  const [apps, setApps] = useState<AppEntry[]>(loadApps)
  const navigate = useNavigate()
  const { configured, user } = useAuth()

  useEffect(() => {
    let cancelled = false
    fetchApps().then(remote => { if (!cancelled) setApps(remote) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">
              My Hub
            </span>
          </div>
          <div className="flex items-center gap-1">
            {configured && (
              <button
                onClick={() => navigate(user ? '/account' : '/login')}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={user ? 'Account' : 'Accedi'}
              >
                <UserCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => navigate('/admin')}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Admin"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Le mie app
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400 text-lg">
          Strumenti personali sempre a portata di mano.
        </p>
      </div>

      {/* App grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app) => {
            const s = statusLabel[app.status]
            const isLive = app.status === 'live'
            const isInternal = Boolean(app.route)

            const cardClasses = [
              'group relative flex flex-col rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-200 text-left',
              isLive
                ? 'border-zinc-200 dark:border-zinc-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                : 'border-zinc-200 dark:border-zinc-800 opacity-60 cursor-default',
            ].join(' ')

            const inner = (
              <>
                <div className={`h-2 w-full bg-gradient-to-r ${app.color}`} />
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{app.icon}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.classes}`}>
                      {s.label}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {app.name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
                    {app.description}
                  </p>
                  {isLive && (
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
                      Apri app {isInternal
                        ? <ArrowRight className="w-3.5 h-3.5" />
                        : <ExternalLink className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>
              </>
            )

            // App interna alla shell → naviga dentro l'hub
            if (isInternal) {
              return (
                <button
                  key={app.id}
                  type="button"
                  disabled={!isLive}
                  onClick={() => isLive && app.route && navigate(app.route)}
                  className={cardClasses}
                >
                  {inner}
                </button>
              )
            }

            // App esterna → apre l'URL in un nuovo tab
            return (
              <a
                key={app.id}
                href={isLive ? app.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClasses}
              >
                {inner}
              </a>
            )
          })}

          {/* Placeholder */}
          <button
            onClick={() => navigate('/admin')}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center min-h-[200px] hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors group"
          >
            <span className="text-3xl mb-3">＋</span>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 group-hover:text-brand-500 transition-colors">
              Aggiungi un'app
            </p>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        My Hub · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
