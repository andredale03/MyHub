import PayStatsApp from './App'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ToastContainer'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Punto di montaggio di PayStats come modulo dell'hub.
 * Incapsula l'app nel suo ToastProvider locale così resta autosufficiente
 * quando viene montata come route della shell (/app/paystats).
 * L'ErrorBoundary evita schermi bianchi mostrando l'eventuale errore.
 */
export default function PayStats() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PayStatsApp />
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  )
}
