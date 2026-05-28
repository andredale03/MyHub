import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Expense } from '../types'

interface Props {
  expenses: Expense[]
  dark?: boolean
}

function dailyTotals(expenses: Expense[], year: number, month: number): number[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daily = new Array<number>(daysInMonth).fill(0)
  expenses.forEach(e => {
    const d = new Date(e.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      daily[d.getDate() - 1] += e.amount
    }
  })
  return daily
}

export function TrendChart({ expenses, dark }: Props) {
  const now   = new Date()
  const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const curr  = dailyTotals(expenses, now.getFullYear(), now.getMonth())
  const last  = dailyTotals(expenses, prev.getFullYear(), prev.getMonth())
  const len   = Math.max(curr.length, last.length)

  const data = Array.from({ length: len }, (_, i) => ({
    day: i + 1,
    'Questo mese': curr[i] > 0 ? Math.round(curr[i] * 100) / 100 : null,
    'Mese scorso':  last[i] > 0 ? Math.round(last[i] * 100) / 100 : null,
  }))

  const grid = dark ? '#334155' : '#e2e8f0'
  const axis = dark ? '#64748b' : '#94a3b8'

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean; label?: number
    payload?: Array<{ name: string; value: number; color: string }>
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl px-3 py-2 shadow-card text-sm">
        <p className="font-semibold text-surface-700 dark:text-surface-200 mb-1">Giorno {label}</p>
        {payload.map((p, i) => p.value != null && (
          <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: €{p.value.toFixed(2)}</p>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="day" tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
        <YAxis tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={v => `€${v}`} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="Questo mese" stroke="#6366f1" strokeWidth={2} dot={false} connectNulls={false} />
        <Line type="monotone" dataKey="Mese scorso" stroke={dark ? '#64748b' : '#94a3b8'}
          strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
