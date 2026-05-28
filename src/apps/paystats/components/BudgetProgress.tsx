import type { Category, Expense } from '../types'

interface Props {
  expenses: Expense[]
  categories: Category[]
}

export function BudgetProgress({ expenses, categories }: Props) {
  const now = new Date()

  const monthExp = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const withBudget = categories.filter(c => c.budget && c.budget > 0)

  if (withBudget.length === 0) {
    return (
      <p className="text-sm text-surface-400 dark:text-surface-500 italic">
        Imposta un budget nelle categorie per monitorarlo qui.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {withBudget.map(cat => {
        const spent = monthExp
          .filter(e => e.categoryId === cat.id)
          .reduce((s, e) => s + e.amount, 0)
        const pct  = Math.min((spent / cat.budget!) * 100, 100)
        const over = spent > cat.budget!
        const warn = pct >= 80 && !over

        return (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                {cat.icon} {cat.name}
              </span>
              <span className={`text-xs font-semibold tabular-nums ${
                over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-surface-500 dark:text-surface-400'
              }`}>
                €{spent.toFixed(0)} / €{cat.budget}
              </span>
            </div>
            <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: over ? '#ef4444' : warn ? '#f59e0b' : cat.color,
                }}
              />
            </div>
            {over && (
              <p className="text-[10px] text-red-500 mt-0.5">
                Sforato di €{(spent - cat.budget!).toFixed(0)}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
