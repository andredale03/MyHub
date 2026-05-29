import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Evita schermi bianchi: mostra l'errore di render invece del vuoto. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: unknown) { console.error('[GyMode] errore di render:', error, info) }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-6">
        <div className="card max-w-lg w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
          <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">Qualcosa è andato storto in GyMode</h1>
          <pre className="mt-3 text-left text-xs bg-surface-100 dark:bg-surface-800 rounded-xl p-3 overflow-auto max-h-40 text-red-600 dark:text-red-400 whitespace-pre-wrap">{error.message}</pre>
          <div className="flex gap-2 justify-center mt-5">
            <button className="btn-primary" onClick={() => this.setState({ error: null })}>Riprova</button>
            <button
              className="btn-secondary"
              onClick={() => {
                Object.keys(localStorage).filter(k => k.startsWith('gymode_')).forEach(k => localStorage.removeItem(k))
                window.location.reload()
              }}
            >
              Reset dati locali
            </button>
          </div>
        </div>
      </div>
    )
  }
}
