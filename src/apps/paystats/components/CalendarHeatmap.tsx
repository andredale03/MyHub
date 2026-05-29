import type { Expense } from '../types'
import { formatMoney } from '../format'

interface Props {
  expenses: Expense[]
  year: number
  month: number
  currency: string
}

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

function intensity(amount: number, max: number): string {
  if (!amount || !max) return ''
  const r = amount / max
  if (r < 0.2)  return 'bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300'
  if (r < 0.45) return 'bg-brand-300 dark:bg-brand-700 text-white'
  if (r < 0.75) return 'bg-brand-500 dark:bg-brand-500 text-white'
  return 'bg-brand-700 dark:bg-brand-300 text-white dark:text-brand-900'
}

export function CalendarHeatmap({ expenses, year, month, currency }: Props) {
  const now    = new Date()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month
  // Solo nel mese corrente i giorni dopo "oggi" sono futuri; nei mesi passati no.
  const today  = isCurrentMonth ? now.getDate() : 32
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // first weekday of month: 0=Sun → remap to Mon=0
  const firstDow = new Date(year, month, 1).getDay()
  const offset   = firstDow === 0 ? 6 : firstDow - 1

  const daily: Record<number, number> = {}
  expenses.forEach(e => {
    const d = new Date(e.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      daily[d.getDate()] = (daily[d.getDate()] ?? 0) + e.amount
    }
  })

  const maxSpend = Math.max(...Object.values(daily), 1)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  type Cell = { day: number | null; amount: number; future: boolean }
  const cells: Cell[] = [
    ...Array.from({ length: offset }, () => ({ day: null, amount: 0, future: false })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: daily[i + 1] ?? 0,
      future: i + 1 > today,
    })),
  ]

  return (
    <div>
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 capitalize mb-3">{monthLabel}</p>

      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-surface-400 dark:text-surface-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={i} />
          const cls = cell.future
            ? 'text-surface-200 dark:text-surface-700'
            : cell.amount > 0
              ? intensity(cell.amount, maxSpend)
              : 'bg-surface-100 dark:bg-surface-700/50 text-surface-400 dark:text-surface-500'
          return (
            <div
              key={i}
              title={cell.amount > 0 ? `${cell.day}: ${formatMoney(cell.amount, currency, 2)}` : String(cell.day)}
              className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-medium transition-colors ${cls}`}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-surface-400 dark:text-surface-500">Meno</span>
        <div className="w-3.5 h-3.5 rounded-sm bg-brand-100 dark:bg-brand-900/60" />
        <div className="w-3.5 h-3.5 rounded-sm bg-brand-300 dark:bg-brand-700" />
        <div className="w-3.5 h-3.5 rounded-sm bg-brand-500" />
        <div className="w-3.5 h-3.5 rounded-sm bg-brand-700 dark:bg-brand-300" />
        <span className="text-[10px] text-surface-400 dark:text-surface-500">Di più</span>
      </div>
    </div>
  )
}
