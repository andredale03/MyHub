import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Category, Expense } from '../types'

interface Props {
  expenses: Expense[]
  categories: Category[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-card-lg border border-surface-100 dark:border-surface-700 px-4 py-3">
      <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">{name}</p>
      <p className="font-bold" style={{ color: p.color }}>
        €{value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-surface-600 dark:text-surface-400">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function PieChart({ expenses, categories }: Props) {
  const data = categories
    .map(cat => ({
      name: `${cat.icon} ${cat.name}`,
      value: expenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-3xl mb-4">📊</div>
        <p className="text-surface-500 dark:text-surface-400 font-medium">Nessun dato da mostrare</p>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 40 }}>
          <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">Totale</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            €{total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {[...data].sort((a, b) => b.value - a.value).map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-surface-600 dark:text-surface-400 flex-1 truncate">{d.name}</span>
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
              €{d.value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-surface-400 dark:text-surface-500 w-10 text-right">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
