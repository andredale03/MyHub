import { createContext, useCallback, useContext, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'error' | 'success' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number   // ms, 0 = sticky
}

interface ToastApi {
  error:   (message: string, title?: string, duration?: number) => void
  success: (message: string, title?: string, duration?: number) => void
  warning: (message: string, title?: string, duration?: number) => void
  info:    (message: string, title?: string, duration?: number) => void
}

interface ToastContextValue {
  toasts: Toast[]
  toast: ToastApi
  dismiss: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = `toast-${++counter.current}`
    const newToast: Toast = { id, type, message, title, duration }
    setToasts(prev => {
      // Cap at 4 visible toasts — drop oldest if needed
      const capped = prev.length >= 4 ? prev.slice(1) : prev
      return [...capped, newToast]
    })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }, [dismiss])

  const toast: ToastApi = {
    error:   (msg, title, dur) => add('error',   msg, title, dur),
    success: (msg, title, dur) => add('success', msg, title, dur),
    warning: (msg, title, dur) => add('warning', msg, title, dur),
    info:    (msg, title, dur) => add('info',    msg, title, dur),
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
