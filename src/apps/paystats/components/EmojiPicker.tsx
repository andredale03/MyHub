import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (emoji: string) => void
}

// Set curato di emoji utili per categorie di spesa, raggruppate per tema.
const GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Cibo', emojis: ['🍔','🍕','🍣','🥗','🍝','☕','🍺','🍷','🛒','🥬','🍎','🍰'] },
  { label: 'Trasporti', emojis: ['🚗','⛽','🚕','🚌','🚆','✈️','🚲','🛵','🅿️','🚢'] },
  { label: 'Casa', emojis: ['🏠','💡','💧','🔥','🛋️','🧹','🔧','📺','🪑','🧺'] },
  { label: 'Svago', emojis: ['🎬','🎮','🎵','🎤','🎟️','🎭','📚','🎨','🏖️','🎳','🎲'] },
  { label: 'Salute', emojis: ['💊','🩺','🏥','💪','🦷','🧘','👓','🧴'] },
  { label: 'Shopping', emojis: ['🛍️','👕','👟','👜','💄','⌚','💍','🎁'] },
  { label: 'Vario', emojis: ['💼','💰','🐾','📱','💻','✏️','🐶','🌱','⚽','🎓','💳','📈'] },
]

export function EmojiPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const pick = (emoji: string) => {
    onChange(emoji)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Pulsantino in stile emoji */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
        aria-label="Scegli emoji"
        title="Scegli un'icona"
      >
        {value || '🙂'}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 max-h-72 overflow-y-auto bg-white dark:bg-surface-900 rounded-2xl shadow-card-lg border border-surface-100 dark:border-surface-800 p-3">
          {/* Emoji personalizzata */}
          <div className="flex gap-2 mb-3">
            <input
              className="input text-base py-1.5"
              placeholder="Incolla un'emoji…"
              value={custom}
              maxLength={4}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) pick(custom.trim()) }}
            />
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 shrink-0"
              disabled={!custom.trim()}
              onClick={() => custom.trim() && pick(custom.trim())}
            >
              Usa
            </button>
          </div>

          {GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1 px-0.5">
                {group.label}
              </p>
              <div className="grid grid-cols-7 gap-1">
                {group.emojis.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => pick(em)}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                      value === em
                        ? 'bg-brand-100 dark:bg-brand-900/40 ring-2 ring-brand-400'
                        : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
