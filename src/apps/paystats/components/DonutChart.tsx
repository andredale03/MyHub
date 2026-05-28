import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Category, Expense } from '../types'

interface Props {
  expenses: Expense[]
  categories: Category[]
  dark?: boolean
}

export function DonutChart({ expenses, categories }: Props) {
  const now = new Date()
  const monthExp = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const data = categories
    .map(cat => ({
      name: `${cat.icon} ${cat.name}`,
      value: monthExp.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-surface-400 dark:text-surface-500 text-sm italic">
        Nessuna spesa questo mese
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl px-3 py-2 shadow-card text-sm">
        <p className="font-medium text-surface-800 dark:text-surface-100">{item.name}</p>
        <p className="text-surface-600 dark:text-surface-300">€{item.value.toFixed(2)}</p>
        <p className="text-surface-400 dark:text-surface-500 text-xs">{((item.value / total) * 100).toFixed(1)}%</p>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest">Totale</span>
          <span className="text-xl font-bold text-surface-900 dark:text-surface-50">
            €{total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 px-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-surface-500 dark:text-surface-400 truncate flex-1">{d.name}</span>
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 flex-shrink-0">
              €{d.value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
