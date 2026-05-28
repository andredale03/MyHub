import { useState, useMemo, useCallback } from 'react'
import { Plus, LayoutDashboard, List, TrendingDown, Tag } from 'lucide-react'
import { useExpenses } from './hooks/useExpenses'
import { useTheme } from './hooks/useTheme'
import { useToast } from './context/ToastContext'
import { AddExpenseModal } from './components/AddExpenseModal'
import { ManageCategoriesModal } from './components/ManageCategoriesModal'
import { ExpenseList } from './components/ExpenseList'
import { DonutChart } from './components/DonutChart'
import { TrendChart } from './components/TrendChart'
import { CategoryBarChart } from './components/CategoryBarChart'
import { CalendarHeatmap } from './components/CalendarHeatmap'
import { InsightsPanel } from './components/InsightsPanel'
import { BudgetProgress } from './components/BudgetProgress'
import { SettingsMenu } from './components/SettingsMenu'

type View  = 'dashboard' | 'expenses'
type Modal = 'add' | 'categories' | null

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function App() {
  const {
    categories, expenses, income,
    setIncome, addCategory, updateCategory, deleteCategory,
    addExpense, deleteExpense, resetToDemo,
  } = useExpenses()
  const { toast }             = useToast()
  const { theme, toggle: toggleTheme } = useTheme()
  const [view,      setView]      = useState<View>('dashboard')
  const [modal,     setModal]     = useState<Modal>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const dark = theme === 'dark'

  const handleDeleteExpense = useCallback((id: string) => {
    try {
      deleteExpense(id)
      toast.info('Spesa eliminata.', 'Eliminata')
    } catch {
      toast.error('Impossibile eliminare la spesa. Riprova.', 'Errore')
    }
  }, [deleteExpense, toast])

  // ── dashboard stats ────────────────────────────────────────────────────────
  const now          = new Date()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed   = now.getDate()
  const daysLeft     = daysInMonth - daysPassed

  const monthExpenses = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }), [expenses])

  const prevMonthExpenses = useMemo(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === p.getMonth() && d.getFullYear() === p.getFullYear()
    })
  }, [expenses])

  const totalSpent   = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses])
  const prevTotal    = useMemo(() => prevMonthExpenses.reduce((s, e) => s + e.amount, 0), [prevMonthExpenses])
  const balance      = income - totalSpent
  const dailyAvg     = daysPassed > 0 ? totalSpent / daysPassed : 0
  const projected    = totalSpent + dailyAvg * daysLeft
  const predicted    = income - projected
  const vsLast       = prevTotal > 0 ? ((totalSpent / prevTotal) - 1) * 100 : 0

  const recent = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
    [expenses]
  )

  const filtered = useMemo(
    () => filterCat === 'all' ? expenses : expenses.filter(e => e.categoryId === filterCat),
    [expenses, filterCat]
  )

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex transition-colors duration-200">

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 p-5 fixed top-0 left-0 bottom-0 transition-colors duration-200">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <TrendingDown size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-surface-900 dark:text-surface-50">PayStats</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard"
            active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={<List size={18} />} label="Spese"
            active={view === 'expenses'}  onClick={() => setView('expenses')} />
          <NavItem icon={<Tag size={18} />} label="Categorie"
            active={modal === 'categories'} onClick={() => setModal('categories')} />
        </nav>

        <div className="flex items-center gap-2">
          <button className="btn-primary flex-1 justify-center" onClick={() => setModal('add')}>
            <Plus size={16} /> Nuova spesa
          </button>
          <SettingsMenu
            compact
            theme={theme}
            onToggleTheme={toggleTheme}
            income={income}
            onSetIncome={setIncome}
            onResetDemo={resetToDemo}
          />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-0">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <TrendingDown size={16} className="text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-50">PayStats</span>
          </div>
          <SettingsMenu
            compact
            dropUp={false}
            theme={theme}
            onToggleTheme={toggleTheme}
            income={income}
            onSetIncome={setIncome}
            onResetDemo={resetToDemo}
          />
        </header>

        <div className="px-4 md:px-8 py-4 md:py-8 max-w-5xl mx-auto space-y-5">

          {/* ── Dashboard view ──────────────────────────────────────────────── */}
          {view === 'dashboard' && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                <StatCard
                  label="Reddito mensile"
                  value={`€${fmt(income)}`}
                  sub="netto/mese"
                  accent="bg-emerald-500"
                />
                <StatCard
                  label="Spese mese"
                  value={`€${fmt(totalSpent)}`}
                  sub={`${monthExpenses.length} transazioni`}
                  accent="bg-red-400"
                  delta={prevTotal > 0 ? vsLast : undefined}
                />
                <StatCard
                  label="Saldo"
                  value={`€${fmt(balance)}`}
                  sub="rimanente"
                  accent={balance >= 0 ? 'bg-brand-500' : 'bg-red-500'}
                />
                <StatCard
                  label="Media giornaliera"
                  value={`€${fmt(dailyAvg)}`}
                  sub={`${daysLeft} giorni rimasti`}
                  accent="bg-amber-500"
                />
                <StatCard
                  label="Risparmio previsto"
                  value={`€${fmt(Math.abs(predicted))}`}
                  sub={predicted >= 0 ? 'a fine mese' : 'deficit previsto'}
                  accent={predicted >= 0 ? 'bg-violet-500' : 'bg-red-500'}
                  className="col-span-2 xl:col-span-1"
                  negative={predicted < 0}
                />
              </div>

              {/* Smart insights */}
              <div className="card">
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-1.5">
                  💡 Smart Insights
                </h2>
                <InsightsPanel expenses={expenses} categories={categories} income={income} />
              </div>

              {/* Donut chart + Budget progress */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="card">
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-4">
                    Distribuzione spese
                  </h2>
                  <DonutChart expenses={expenses} categories={categories} dark={dark} />
                </div>
                <div className="card">
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-4">
                    Budget per categoria
                  </h2>
                  <BudgetProgress expenses={expenses} categories={categories} />
                </div>
              </div>

              {/* Spending trend line chart */}
              <div className="card">
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-1">
                  Andamento giornaliero
                </h2>
                <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">
                  Spese per giorno — questo mese vs mese scorso
                </p>
                <TrendChart expenses={expenses} dark={dark} />
              </div>

              {/* Category comparison + Calendar */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="card">
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-1">
                    Confronto categorie
                  </h2>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">
                    Questo mese vs mese scorso
                  </p>
                  <CategoryBarChart expenses={expenses} categories={categories} dark={dark} />
                </div>
                <div className="card">
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-4">
                    Calendario spese
                  </h2>
                  <CalendarHeatmap expenses={expenses} />
                </div>
              </div>

              {/* Recent transactions */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50">
                    Ultime transazioni
                  </h2>
                  <button className="btn-ghost text-xs" onClick={() => setView('expenses')}>
                    Vedi tutte →
                  </button>
                </div>
                <ExpenseList expenses={recent} categories={categories} onDelete={handleDeleteExpense} />
              </div>
            </>
          )}

          {/* ── Expenses view ───────────────────────────────────────────────── */}
          {view === 'expenses' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-surface-900 dark:text-surface-50">Tutte le spese</h2>
                <button className="btn-primary hidden md:inline-flex" onClick={() => setModal('add')}>
                  <Plus size={15} /> Aggiungi
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  className={`chip ${filterCat === 'all' ? 'chip-active' : 'chip-inactive'}`}
                  onClick={() => setFilterCat('all')}
                >
                  Tutte
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`chip ${filterCat === cat.id ? 'chip-active' : 'chip-inactive'}`}
                    style={filterCat === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                    onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              <ExpenseList expenses={filtered} categories={categories} onDelete={handleDeleteExpense} />
            </div>
          )}

        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 flex items-center h-16 z-40 transition-colors duration-200">
        <MobileNavItem icon={<LayoutDashboard size={20} />} label="Dashboard"
          active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <MobileNavItem icon={<List size={20} />} label="Spese"
          active={view === 'expenses'}  onClick={() => setView('expenses')} />
        <button
          onClick={() => setModal('add')}
          className="flex-1 flex flex-col items-center justify-center"
          aria-label="Aggiungi spesa"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-card-lg -mt-5 active:scale-95 transition-transform">
            <Plus size={22} className="text-white" />
          </div>
        </button>
        <MobileNavItem icon={<Tag size={20} />} label="Categorie"
          onClick={() => setModal('categories')} />
      </nav>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal === 'add' && (
        <AddExpenseModal categories={categories} onAdd={addExpense} onClose={() => setModal(null)} />
      )}
      {modal === 'categories' && (
        <ManageCategoriesModal
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ── Local components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, delta, className, negative,
}: {
  label: string; value: string; sub: string; accent: string
  delta?: number; className?: string; negative?: boolean
}) {
  return (
    <div className={`card relative overflow-hidden ${className ?? ''}`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 dark:opacity-20 -translate-y-8 translate-x-8 ${accent}`} />
      <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide leading-tight">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${negative ? 'text-red-500' : 'text-surface-900 dark:text-surface-50'}`}>
        {negative && '−'}{value}
      </p>
      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
        <p className="text-xs text-surface-400 dark:text-surface-500">{sub}</p>
        {delta !== undefined && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            delta > 5
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : delta < -5
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
          }`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-800 dark:hover:text-surface-100'
      }`}
    >
      <span className={active ? 'text-brand-500 dark:text-brand-400' : ''}>{icon}</span>
      {label}
    </button>
  )
}

function MobileNavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 ${
        active ? 'text-brand-500' : 'text-surface-400 dark:text-surface-500'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
