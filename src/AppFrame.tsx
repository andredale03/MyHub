import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Cornice della shell attorno a un'app montata internamente.
 * Mostra l'app a tutto schermo con un pulsante flottante per tornare all'hub.
 * Posizionato in basso a destra per non sovrapporsi alla sidebar (sinistra)
 * né alla bottom-nav mobile (che occupa il fondo a tutta larghezza).
 */
export default function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[100dvh] overflow-hidden">
      {children}
      <Link
        to="/"
        className="fixed z-[60] right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5 md:right-5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 text-sm font-medium shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95 transition-transform"
        aria-label="Torna all'hub"
      >
        <ArrowLeft className="w-4 h-4" /> Hub
      </Link>
    </div>
  )
}
