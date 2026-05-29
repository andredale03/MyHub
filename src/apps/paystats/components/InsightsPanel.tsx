import { TrendingUp, TrendingDown, AlertTriangle, Target, Zap } from 'lucide-react'
import type { Category, Expense } from '../types'
import { formatMoney } from '../format'

interface Props {
  expenses: Expense[]
  categories: Category[]
  income: number
  year: number
  month: number
  currency: string
}

interface Insight {
  icon: React.ReactNode
  title: string
  body: string
  color: string
  bg: string
}

export function InsightsPanel({ expenses, categories, income, year, month, currency }: Props) {
  const now          = new Date()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const daysPassed   = isCurrentMonth ? now.getDate() : daysInMonth
  const daysLeft     = isCurrentMonth ? daysInMonth - daysPassed : 0

  const monthExp = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const totalSpent  = monthExp.reduce((s, e) => s + e.amount, 0)
  const dailyAvg    = daysPassed > 0 ? totalSpent / daysPassed : 0
  const projected   = totalSpent + dailyAvg * daysLeft
  const savings     = income - projected
  const spendingPct = income > 0 ? (totalSpent / income) * 100 : 0
  const expectedPct = (daysPassed / daysInMonth) * 100

  const catTotals = new Map<string, number>()
  monthExp.forEach(e => catTotals.set(e.categoryId, (catTotals.get(e.categoryId) ?? 0) + e.amount))

  const ranked = [...categories]
    .map(c => ({ cat: c, total: catTotals.get(c.id) ?? 0 }))
    .sort((a, b) => b.total - a.total)

  const topCat     = ranked[0]
  const overBudget = categories.filter(c => c.budget && (catTotals.get(c.id) ?? 0) > c.budget)
  const onTrack    = spendingPct <= expectedPct + 5

  const insights: Insight[] = []

  if (topCat?.total > 0) {
    insights.push({
      icon: <span className="text-base leading-none">{topCat.cat.icon}</span>,
      title: 'Categoria principale',
      body: `${topCat.cat.name} · ${formatMoney(topCat.total, currency)} (${totalSpent > 0 ? ((topCat.total / totalSpent) * 100).toFixed(0) : 0}% del totale)`,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/40',
    })
  }

  if (income > 0) {
    insights.push({
      icon: savings >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
      title: isCurrentMonth ? 'Risparmio previsto' : 'Risparmio del mese',
      body: savings >= 0
        ? (isCurrentMonth
            ? `A fine mese stimi di risparmiare ${formatMoney(savings, currency)}`
            : `Hai risparmiato ${formatMoney(savings, currency)}`)
        : (isCurrentMonth
            ? `Rischi di sforare il budget di ${formatMoney(Math.abs(savings), currency)}`
            : `Hai sforato il budget di ${formatMoney(Math.abs(savings), currency)}`),
      color: savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      bg: savings >= 0
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40'
        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40',
    })
  }

  if (overBudget.length > 0) {
    insights.push({
      icon: <AlertTriangle size={16} />,
      title: 'Budget superato',
      body: `${overBudget.map(c => c.name).join(', ')} ${overBudget.length === 1 ? 'ha' : 'hanno'} superato il budget`,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40',
    })
  }

  if (income > 0 && monthExp.length > 0) {
    insights.push({
      icon: onTrack ? <Target size={16} /> : <Zap size={16} />,
      title: 'Ritmo di spesa',
      body: onTrack
        ? `In linea: ${spendingPct.toFixed(0)}% del reddito nel ${expectedPct.toFixed(0)}% del mese`
        : `Ritmo elevato: ${spendingPct.toFixed(0)}% del reddito speso`,
      color: onTrack ? 'text-brand-600 dark:text-brand-400' : 'text-amber-600 dark:text-amber-400',
      bg: onTrack
        ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800/40'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40',
    })
  }

  if (insights.length === 0) {
    return (
      <p className="text-sm text-surface-400 dark:text-surface-500 italic">
        Aggiungi spese per vedere i tuoi insights personalizzati.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {insights.map((ins, i) => (
        <div key={i} className={`flex gap-3 p-3 rounded-xl border ${ins.bg}`}>
          <div className={`flex-shrink-0 mt-0.5 ${ins.color}`}>{ins.icon}</div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${ins.color}`}>{ins.title}</p>
            <p className="text-xs text-surface-600 dark:text-surface-300 mt-0.5 leading-relaxed">{ins.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
