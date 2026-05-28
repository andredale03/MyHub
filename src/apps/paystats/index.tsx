import PayStatsApp from './App'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ToastContainer'

/**
 * Punto di montaggio di PayStats come modulo dell'hub.
 * Incapsula l'app nel suo ToastProvider locale così resta autosufficiente
 * quando viene montata come route della shell (/app/paystats).
 */
export default function PayStats() {
  return (
    <ToastProvider>
      <PayStatsApp />
      <ToastContainer />
    </ToastProvider>
  )
}
