import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Modale a tutta altezza su mobile (bottom sheet), centrato su desktop. */
export function Sheet({ title, subtitle, onClose, children, footer }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-surface-900 rounded-t-2xl sm:rounded-2xl shadow-card-lg border border-surface-100 dark:border-surface-800 flex flex-col max-h-[92dvh] sm:max-h-[88dvh] sheet-slide-up">
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 truncate">{title}</h2>
            {subtitle && <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button className="btn-ghost p-1.5 shrink-0" onClick={onClose} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
        {footer && (
          <div className="flex gap-2 px-5 py-4 border-t border-surface-100 dark:border-surface-800 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
