import { Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Category, Expense } from '../types'
import { formatMoney } from '../format'

interface Props {
  expenses: Expense[]
  categories: Category[]
  currency: string
  onDelete: (id: string) => void
  onEdit?: (exp: Expense) => void
}

export function ExpenseList({ expenses, categories, currency, onDelete, onEdit }: Props) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-3xl mb-4">💸</div>
        <p className="text-surface-500 dark:text-surface-400 font-medium">Nessuna spesa trovata</p>
        <p className="text-surface-400 dark:text-surface-500 text-sm mt-1">Aggiungi la tua prima spesa!</p>
      </div>
    )
  }

  const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let lastDate = ''

  return (
    <div className="space-y-1">
      {sorted.map(exp => {
        const cat = catMap[exp.categoryId]
        const dateLabel = format(new Date(exp.date), 'd MMMM yyyy', { locale: it })
        const showDate = dateLabel !== lastDate
        lastDate = dateLabel

        return (
          <div key={exp.id}>
            {showDate && (
              <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide pt-4 pb-1 px-1">
                {dateLabel}
              </p>
            )}
            <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 border border-transparent hover:border-surface-100 dark:hover:border-surface-700 transition-all">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: cat ? `${cat.color}22` : '#f4f4f5' }}
              >
                {cat?.icon ?? '❓'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-800 dark:text-surface-100 text-sm truncate">
                  {exp.description || cat?.name || 'Spesa'}
                </p>
                {cat && (
                  <span
                    className="badge text-xs mt-0.5"
                    style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                  >
                    {cat.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-bold text-surface-900 dark:text-surface-50">
                  {formatMoney(exp.amount, currency, 2)}
                </span>
                {onEdit && (
                  <button
                    className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100"
                    onClick={() => onEdit(exp)}
                    aria-label="Modifica spesa"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button className="btn-danger p-1.5 opacity-0 group-hover:opacity-100" onClick={() => onDelete(exp.id)} aria-label="Elimina spesa">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
