import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, ExternalLink, Settings, UserCircle, Plus } from 'lucide-react'
import { loadApps, fetchApps, type AppEntry } from './storage'
import { useAuth } from './auth/AuthContext'
import { useTheme } from './lib/theme'

const statusLabel: Record<AppEntry['status'], { label: string; classes: string }> = {
  live:    { label: 'Live',        classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  wip:     { label: 'In corso',    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  planned: { label: 'Pianificata', classes: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
}

/** Logo dell'hub: l'icona dell'app (favicon.svg). */
function HubLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return <img src="/favicon.svg" alt="MyHub" className={`${className} object-contain`} />
}

function HeaderButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      {children}
    </button>
  )
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
    // App-shell: header fisso, scrolla solo il contenuto centrale.
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-200">

      {/* Header */}
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HubLogo />
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">MyHub</span>
          </div>
          <div className="flex items-center gap-1">
            {configured && (
              <HeaderButton onClick={() => navigate(user ? '/account' : '/login')} label={user ? 'Account' : 'Accedi'}>
                <UserCircle className="w-4 h-4" />
              </HeaderButton>
            )}
            <HeaderButton onClick={() => navigate('/admin')} label="Admin">
              <Settings className="w-4 h-4" />
            </HeaderButton>
            <HeaderButton onClick={toggleTheme} label="Cambia tema">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </HeaderButton>
          </div>
        </div>
      </header>

      {/* Contenuto scrollabile */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">

          {/* Intestazione */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Le tue app</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Tutti i tuoi strumenti in un unico posto.
            </p>
          </div>

          {/* Griglia app — stile launcher */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {apps.map((app) => {
              const s = statusLabel[app.status]
              const isLive = app.status === 'live'
              const isInternal = Boolean(app.route)

              const tileClasses = [
                'group relative flex flex-col items-center text-center gap-3 rounded-2xl border p-4 transition-all duration-200',
                'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
                isLive
                  ? 'hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
                  : 'opacity-55 cursor-default',
              ].join(' ')

              const inner = (
                <>
                  {/* Icona app (tessera gradient) */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-3xl shadow-card-lg transition-transform duration-200 ${isLive ? 'group-hover:scale-105' : ''}`}>
                    {app.icon}
                  </div>

                  <div className="min-w-0 w-full">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center justify-center gap-1">
                      {app.name}
                      {isLive && !isInternal && <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                      {app.description}
                    </p>
                  </div>

                  {/* Badge stato solo per app non live */}
                  {!isLive && (
                    <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${s.classes}`}>
                      {s.label}
                    </span>
                  )}
                </>
              )

              if (isInternal) {
                return (
                  <button key={app.id} type="button" disabled={!isLive}
                    onClick={() => isLive && app.route && navigate(app.route)} className={tileClasses}>
                    {inner}
                  </button>
                )
              }
              return (
                <a key={app.id} href={isLive ? app.url : undefined} target="_blank" rel="noopener noreferrer" className={tileClasses}>
                  {inner}
                </a>
              )
            })}

            {/* Aggiungi un'app */}
            <button
              onClick={() => navigate('/admin')}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-4 min-h-[148px] hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-brand-500 transition-colors">
                <Plus className="w-7 h-7" />
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-brand-500 transition-colors">
                Aggiungi un'app
              </span>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-10">
            MyHub · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
