import { useState, useRef, useEffect } from 'react'
import { Settings, Sun, Moon, X, Check, RotateCcw } from 'lucide-react'

interface Props {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  income: number
  onSetIncome: (v: number) => void
  onResetDemo?: () => void
  /** Mostra solo l'icona (nessun testo) */
  compact?: boolean
  /** Il dropdown si apre verso l'alto (default true) o verso il basso */
  dropUp?: boolean
}

export function SettingsMenu({ theme, onToggleTheme, income, onSetIncome, onResetDemo, compact, dropUp = true }: Props) {
  const [open,       setOpen]       = useState(false)
  const [editIncome, setEditIncome] = useState(false)
  const [draft,      setDraft]      = useState('')
  const ref    = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setEditIncome(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (editIncome) {
      setDraft(String(income))
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [editIncome, income])

  function saveIncome() {
    const v = parseFloat(draft.replace(',', '.'))
    if (!isNaN(v) && v >= 0) onSetIncome(v)
    setEditIncome(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className={compact
          ? 'btn-ghost p-2.5 rounded-xl'
          : 'btn-ghost p-2 rounded-xl w-full justify-start gap-2'}
        onClick={() => setOpen(o => !o)}
        aria-label="Impostazioni"
      >
        <Settings size={18} className="text-surface-500 dark:text-surface-400" />
        {!compact && <span className="text-sm text-surface-600 dark:text-surface-300">Impostazioni</span>}
      </button>

      {open && (
        <div className={`absolute w-72 bg-white dark:bg-surface-800 rounded-2xl shadow-card-lg border border-surface-100 dark:border-surface-700 z-50 overflow-hidden ${compact ? 'right-0' : 'left-0'} ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700">
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">Impostazioni</span>
            <button className="btn-ghost p-1" onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>

          {/* Theme */}
          <div className="p-3 border-b border-surface-100 dark:border-surface-700">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-2 px-1">
              Tema
            </p>
            <div className="flex gap-2">
              <ThemeButton active={theme === 'light'} icon={<Sun size={15} />} label="Chiaro"
                onClick={() => { if (theme !== 'light') onToggleTheme(); setOpen(false) }} />
              <ThemeButton active={theme === 'dark'} icon={<Moon size={15} />} label="Scuro"
                onClick={() => { if (theme !== 'dark') onToggleTheme(); setOpen(false) }} />
            </div>
          </div>

          {/* Income */}
          <div className="p-3 border-b border-surface-100 dark:border-surface-700">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-2 px-1">
              Reddito mensile
            </p>
            {editIncome ? (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  className="input flex-1 text-sm"
                  type="number"
                  min="0"
                  step="100"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveIncome(); if (e.key === 'Escape') setEditIncome(false) }}
                />
                <button className="btn-primary px-3 py-2" onClick={saveIncome} aria-label="Salva">
                  <Check size={15} />
                </button>
              </div>
            ) : (
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 hover:border-brand-300 transition-colors"
                onClick={() => setEditIncome(true)}
              >
                <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                  €{income.toLocaleString('it-IT')}
                </span>
                <span className="text-xs text-surface-400 dark:text-surface-500">Modifica →</span>
              </button>
            )}
          </div>

          {/* Demo data */}
          {onResetDemo && (
            <div className="p-3">
              <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-2 px-1">
                Dati demo
              </p>
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 hover:border-red-300 hover:text-red-600 transition-colors"
                onClick={() => { if (window.confirm('Ripristinare i dati demo? Le spese attuali saranno cancellate.')) onResetDemo() }}
              >
                <RotateCcw size={14} />
                Ripristina dati demo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ThemeButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all border ${
        active
          ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-700'
          : 'bg-surface-50 dark:bg-surface-700 text-surface-500 dark:text-surface-400 border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}
