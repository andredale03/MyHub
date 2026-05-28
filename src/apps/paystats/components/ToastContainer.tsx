import { useEffect, useRef, useState } from 'react'
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import type { Toast, ToastType } from '../context/ToastContext'

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG: Record<ToastType, {
  icon: React.ReactNode
  bar: string
  bg: string
  border: string
  title: string
  text: string
}> = {
  error: {
    icon:   <AlertCircle size={18} className="flex-shrink-0 text-red-500" />,
    bar:    'bg-red-500',
    bg:     'bg-white dark:bg-surface-800',
    border: 'border-red-200 dark:border-red-900',
    title:  'text-red-700 dark:text-red-400',
    text:   'text-red-600 dark:text-red-300',
  },
  success: {
    icon:   <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-500" />,
    bar:    'bg-emerald-500',
    bg:     'bg-white dark:bg-surface-800',
    border: 'border-emerald-200 dark:border-emerald-900',
    title:  'text-emerald-700 dark:text-emerald-400',
    text:   'text-emerald-600 dark:text-emerald-300',
  },
  warning: {
    icon:   <AlertTriangle size={18} className="flex-shrink-0 text-amber-500" />,
    bar:    'bg-amber-400',
    bg:     'bg-white dark:bg-surface-800',
    border: 'border-amber-200 dark:border-amber-900',
    title:  'text-amber-700 dark:text-amber-400',
    text:   'text-amber-600 dark:text-amber-300',
  },
  info: {
    icon:   <Info size={18} className="flex-shrink-0 text-brand-500" />,
    bar:    'bg-brand-500',
    bg:     'bg-white dark:bg-surface-800',
    border: 'border-brand-200 dark:border-brand-900',
    title:  'text-brand-700 dark:text-brand-400',
    text:   'text-brand-600 dark:text-brand-300',
  },
}

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const cfg = CONFIG[toast.type]

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setLeaving(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'relative w-80 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-card-lg overflow-hidden',
        'transition-all duration-300 ease-out',
        cfg.bg,
        cfg.border,
        visible && !leaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-4 opacity-0',
      ].join(' ')}
    >
      {/* Progress bar */}
      {toast.duration > 0 && (
        <ProgressBar duration={toast.duration} color={cfg.bar} onExpire={dismiss} />
      )}

      <div className="flex items-start gap-3 px-4 py-3.5">
        {cfg.icon}

        <div className="flex-1 min-w-0 pt-px">
          {toast.title && (
            <p className={`text-sm font-semibold leading-snug ${cfg.title}`}>{toast.title}</p>
          )}
          <p className={`text-sm leading-snug ${toast.title ? 'mt-0.5 ' : ''}${cfg.text}`}>
            {toast.message}
          </p>
        </div>

        <button
          onClick={dismiss}
          className="flex-shrink-0 p-0.5 rounded-lg text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          aria-label="Chiudi"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ duration, color, onExpire }: { duration: number; color: string; onExpire: () => void }) {
  const [width, setWidth] = useState(100)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    function tick(now: number) {
      if (!startRef.current) startRef.current = now
      const elapsed = now - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setWidth(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        onExpire()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [duration, onExpire])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-100 dark:bg-surface-700">
      <div
        className={`h-full ${color} transition-none`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      aria-label="Notifiche"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
