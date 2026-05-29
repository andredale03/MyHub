import { X, ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { widgetLabel, DEFAULT_LAYOUT, type WidgetState } from '../dashboard'

interface Props {
  layout: WidgetState[]
  onChange: (layout: WidgetState[]) => void
  onClose: () => void
}

export function CustomizeDashboardModal({ layout, onChange, onClose }: Props) {
  const toggle = (key: string) =>
    onChange(layout.map(w => w.key === key ? { ...w, visible: !w.visible } : w))

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= layout.length) return
    const next = [...layout]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <BottomSheet onClose={onClose} desktopMaxW="sm:max-w-lg">
      <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-4 border-b border-surface-100 dark:border-surface-800 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">Personalizza dashboard</h2>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
            Mostra/nascondi i riquadri e riordinali
          </p>
        </div>
        <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Chiudi"><X size={18} /></button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
        {layout.map((w, i) => (
          <div
            key={w.key}
            className={`flex items-center gap-3 p-3 rounded-2xl border border-surface-100 dark:border-surface-800 ${
              w.visible ? '' : 'opacity-50'
            }`}
          >
            <div className="flex flex-col">
              <button
                className="btn-ghost p-1 disabled:opacity-30"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Sposta su"
              >
                <ChevronUp size={16} />
              </button>
              <button
                className="btn-ghost p-1 disabled:opacity-30"
                onClick={() => move(i, 1)}
                disabled={i === layout.length - 1}
                aria-label="Sposta giù"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <span className="flex-1 text-sm font-medium text-surface-800 dark:text-surface-100">
              {widgetLabel(w.key)}
            </span>
            <button
              className={`btn-ghost p-2 ${w.visible ? 'text-brand-500' : ''}`}
              onClick={() => toggle(w.key)}
              aria-label={w.visible ? 'Nascondi' : 'Mostra'}
            >
              {w.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-surface-100 dark:border-surface-800 flex-shrink-0">
        <button className="btn-secondary w-full justify-center" onClick={() => onChange(DEFAULT_LAYOUT)}>
          <RotateCcw size={15} /> Ripristina predefinito
        </button>
      </div>
    </BottomSheet>
  )
}
