import GymodeApp from './App'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Punto di montaggio di GyMode come modulo dell'hub (route /app/gymode).
 * Personal: crea/modifica le schede. Utente: le visualizza ed esegue.
 */
export default function Gymode() {
  return (
    <ErrorBoundary>
      <GymodeApp />
    </ErrorBoundary>
  )
}
