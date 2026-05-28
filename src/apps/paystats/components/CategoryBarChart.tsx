import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Category, Expense } from '../types'

interface Props {
  expenses: Expense[]
  categories: Category[]
  dark?: boolean
}

function monthTotals(expenses: Expense[], year: number, month: number): Record<string, number> {
  const totals: Record<string, number> = {}
  expenses.forEach(e => {
    const d = new Date(e.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount
    }
  })
  return totals
}

export function CategoryBarChart({ expenses, categories, dark }: Props) {
  const now  = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const curr = monthTotals(expenses, now.getFullYear(), now.getMonth())
  const last = monthTotals(expenses, prev.getFullYear(), prev.getMonth())

  const data = categories
    .map(cat => ({
      name: cat.icon + ' ' + (cat.name.length > 9 ? cat.name.slice(0, 9) + '…' : cat.name),
      fullName: cat.name,
      'Questo mese': Math.round((curr[cat.id] ?? 0) * 100) / 100,
      'Mese scorso':  Math.round((last[cat.id] ?? 0) * 100) / 100,
      color: cat.color,
    }))
    .filter(d => d['Questo mese'] > 0 || d['Mese scorso'] > 0)

  const grid = dark ? '#334155' : '#e2e8f0'
  const axis = dark ? '#64748b' : '#94a3b8'

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean; label?: string
    payload?: Array<{ name: string; value: number; color: string }>
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl px-3 py-2 shadow-card text-sm">
        <p className="font-semibold text-surface-700 dark:text-surface-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: €{p.value.toFixed(2)}</p>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 5 }} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={v => `€${v}`} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="Questo mese" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="Mese scorso"  fill={dark ? '#475569' : '#cbd5e1'} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
