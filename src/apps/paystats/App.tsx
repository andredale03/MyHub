import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LayoutDashboard, List, TrendingDown, Tag, ChevronLeft, ChevronRight, SlidersHorizontal, User } from 'lucide-react'
import type { Expense } from './types'
import { formatMoney } from './format'
import { isFullWidth, loadLayout, saveLayout, type WidgetKey, type WidgetState } from './dashboard'
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
import { CustomizeDashboardModal } from './components/CustomizeDashboardModal'

type View  = 'dashboard' | 'expenses'
type Modal = 'add' | 'categories' | null

export default function App() {
  const {
    categories, expenses, income, currency, loading,
    setIncome, setCurrency, addCategory, updateCategory, deleteCategory,
    addExpense, updateExpense, deleteExpense, resetToDemo,
  } = useExpenses()
  const { toast }             = useToast()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [view,      setView]      = useState<View>('dashboard')
  const [modal,     setModal]     = useState<Modal>(null)
  const [editing,   setEditing]   = useState<Expense | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  // Mese di riferimento per la dashboard (primo giorno del mese selezionato).
  const [monthDate, setMonthDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  // Layout personalizzabile della dashboard (preferenza per-dispositivo).
  const [layout, setLayoutState] = useState<WidgetState[]>(loadLayout)
  const [customizing, setCustomizing] = useState(false)
  const dark = theme === 'dark'

  const setLayout = useCallback((l: WidgetState[]) => { setLayoutState(l); saveLayout(l) }, [])

  const money = useCallback((n: number, decimals = 0) => formatMoney(n, currency, decimals), [currency])

  const closeExpenseModal = useCallback(() => { setModal(null); setEditing(null) }, [])

  const handleDeleteExpense = useCallback((id: string) => {
    try {
      deleteExpense(id)
      toast.info('Spesa eliminata.', 'Eliminata')
    } catch {
      toast.error('Impossibile eliminare la spesa. Riprova.', 'Errore')
    }
  }, [deleteExpense, toast])

  const handleEditExpense = useCallback((exp: Expense) => {
    setEditing(exp)
    setModal('add')
  }, [])

  // ── dashboard stats (mese di riferimento) ───────────────────────────────────
  const now          = new Date()
  const refYear      = monthDate.getFullYear()
  const refMonth     = monthDate.getMonth()
  const isCurrentMonth = refYear === now.getFullYear() && refMonth === now.getMonth()
  const daysInMonth  = new Date(refYear, refMonth + 1, 0).getDate()
  // Nel mese corrente i giorni "passati" sono fino a oggi; nei mesi chiusi è tutto il mese.
  const daysPassed   = isCurrentMonth ? now.getDate() : daysInMonth
  const daysLeft     = isCurrentMonth ? daysInMonth - daysPassed : 0

  const monthExpenses = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === refMonth && d.getFullYear() === refYear
  }), [expenses, refMonth, refYear])

  const prevMonthExpenses = useMemo(() => {
    const p = new Date(refYear, refMonth - 1, 1)
    return expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === p.getMonth() && d.getFullYear() === p.getFullYear()
    })
  }, [expenses, refMonth, refYear])

  const totalSpent   = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses])
  const prevTotal    = useMemo(() => prevMonthExpenses.reduce((s, e) => s + e.amount, 0), [prevMonthExpenses])
  const balance      = income - totalSpent
  const dailyAvg     = daysPassed > 0 ? totalSpent / daysPassed : 0
  // Proiezione solo per il mese corrente; nei mesi chiusi il "previsto" è l'effettivo.
  const projected    = isCurrentMonth ? totalSpent + dailyAvg * daysLeft : totalSpent
  const predicted    = income - projected
  const vsLast       = prevTotal > 0 ? ((totalSpent / prevTotal) - 1) * 100 : 0

  const monthLabel = monthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const gotoPrevMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const gotoNextMonth = () => { if (!isCurrentMonth) setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  const recent = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
    [expenses]
  )

  const filtered = useMemo(
    () => filterCat === 'all' ? expenses : expenses.filter(e => e.categoryId === filterCat),
    [expenses, filterCat]
  )

  // Rende un widget della dashboard per chiave (wrapper card + col-span).
  const renderWidget = (key: WidgetKey) => {
    const cls = `card ${isFullWidth(key) ? 'md:col-span-2' : ''}`
    switch (key) {
      case 'insights':
        return (
          <div key={key} className={cls}>
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-1.5">💡 Smart Insights</h2>
            <InsightsPanel expenses={expenses} categories={categories} income={income} year={refYear} month={refMonth} currency={currency} />
          </div>
        )
      case 'donut':
        return (
          <div key={key} className={cls}>
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-4">Distribuzione spese</h2>
            <DonutChart expenses={expenses} categories={categories} year={refYear} month={refMonth} currency={currency} dark={dark} />
          </div>
        )
      case 'budget':
        return (
          <div key={key} className={cls}>
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-4">Budget per categoria</h2>
            <BudgetProgress expenses={expenses} categories={categories} year={refYear} month={refMonth} currency={currency} />
          </div>
        )
      case 'trend':
        return (
          <div key={key} className={cls}>
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-1">Andamento giornaliero</h2>
            <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Spese per giorno — questo mese vs mese scorso</p>
            <TrendChart expenses={expenses} year={refYear} month={refMonth} currency={currency} dark={dark} />
          </div>
        )
      case 'category':
        return (
          <div key={key} className={cls}>
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-1">Confronto categorie</h2>
            <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Questo mese vs mese scorso</p>
            <CategoryBarChart expenses={expenses} categories={categories} year={refYear} month={refMonth} currency={currency} dark={dark} />
          </div>
        )
      case 'calendar':
        return (
          <div key={key} className={cls}>
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-4">Calendario spese</h2>
            <CalendarHeatmap expenses={expenses} year={refYear} month={refMonth} currency={currency} />
          </div>
        )
      case 'recent':
        return (
          <div key={key} className={cls}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50">Ultime transazioni</h2>
              <button className="btn-ghost text-xs" onClick={() => setView('expenses')}>Vedi tutte →</button>
            </div>
            <ExpenseList expenses={recent} categories={categories} currency={currency} onDelete={handleDeleteExpense} onEdit={handleEditExpense} />
          </div>
        )
      default:
        return null
    }
  }

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
            currency={currency}
            onSetCurrency={setCurrency}
            onResetDemo={resetToDemo}
          />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-5 pb-3 pt-[calc(1.25rem+env(safe-area-inset-top))]">
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
            currency={currency}
            onSetCurrency={setCurrency}
            onResetDemo={resetToDemo}
          />
        </header>

        <div className="px-4 md:px-8 py-4 md:py-8 max-w-5xl mx-auto space-y-5">

          {/* ── Dashboard view ──────────────────────────────────────────────── */}
          {view === 'dashboard' && (
            loading ? (
              <DashboardLoader />
            ) : expenses.length === 0 ? (
              <EmptyDashboard
                income={income}
                currency={currency}
                onAddExpense={() => setModal('add')}
                onManageCategories={() => setModal('categories')}
              />
            ) : (
            <>
              {/* Selettore mese */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <button className="btn-ghost p-2 rounded-xl shrink-0" onClick={gotoPrevMonth} aria-label="Mese precedente">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-semibold text-surface-700 dark:text-surface-200 capitalize text-center truncate">
                    {monthLabel}
                  </span>
                  <button
                    className="btn-ghost p-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    onClick={gotoNextMonth}
                    disabled={isCurrentMonth}
                    aria-label="Mese successivo"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!isCurrentMonth && (
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1))}
                    >
                      Oggi
                    </button>
                  )}
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => setCustomizing(true)}
                    aria-label="Personalizza dashboard"
                  >
                    <SlidersHorizontal size={15} /> Personalizza
                  </button>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                <StatCard
                  label="Reddito mensile"
                  value={money(income)}
                  sub="netto/mese"
                  accent="bg-emerald-500"
                />
                <StatCard
                  label="Spese mese"
                  value={money(totalSpent)}
                  sub={`${monthExpenses.length} transazioni`}
                  accent="bg-red-400"
                  delta={prevTotal > 0 ? vsLast : undefined}
                />
                <StatCard
                  label="Saldo"
                  value={money(balance)}
                  sub="rimanente"
                  accent={balance >= 0 ? 'bg-brand-500' : 'bg-red-500'}
                />
                <StatCard
                  label="Media giornaliera"
                  value={money(dailyAvg)}
                  sub={isCurrentMonth ? `${daysLeft} giorni rimasti` : `su ${daysInMonth} giorni`}
                  accent="bg-amber-500"
                />
                <StatCard
                  label={isCurrentMonth ? 'Risparmio previsto' : 'Risparmio'}
                  value={money(Math.abs(predicted))}
                  sub={isCurrentMonth
                    ? (predicted >= 0 ? 'a fine mese' : 'deficit previsto')
                    : (predicted >= 0 ? 'questo mese' : 'deficit')}
                  accent={predicted >= 0 ? 'bg-violet-500' : 'bg-red-500'}
                  className="col-span-2 xl:col-span-1"
                  negative={predicted < 0}
                />
              </div>

              {/* Widget personalizzabili (ordine e visibilità da "Personalizza") */}
              <div className="grid md:grid-cols-2 gap-5">
                {layout.filter(w => w.visible).map(w => renderWidget(w.key))}
              </div>

              {layout.every(w => !w.visible) && (
                <p className="text-sm text-surface-400 dark:text-surface-500 text-center py-8">
                  Nessun riquadro visibile. Usa <strong>Personalizza</strong> per mostrarne qualcuno.
                </p>
              )}
            </>
            )
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

              <ExpenseList expenses={filtered} categories={categories} currency={currency} onDelete={handleDeleteExpense} onEdit={handleEditExpense} />
            </div>
          )}

        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 flex items-center h-16 z-40 transition-colors duration-200 pb-[env(safe-area-inset-bottom)] box-content">
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
        <MobileNavItem icon={<User size={20} />} label="Account"
          onClick={() => navigate('/account')} />
      </nav>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal === 'add' && (
        <AddExpenseModal
          categories={categories}
          initial={editing}
          currency={currency}
          onAdd={addExpense}
          onUpdate={updateExpense}
          onClose={closeExpenseModal}
        />
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
      {customizing && (
        <CustomizeDashboardModal
          layout={layout}
          onChange={setLayout}
          onClose={() => setCustomizing(false)}
        />
      )}
    </div>
  )
}

// ── Local components ───────────────────────────────────────────────────────────

function DashboardLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-surface-200 dark:border-surface-700 border-t-brand-500 animate-spin mb-4" />
      <p className="text-sm text-surface-400 dark:text-surface-500">Carico i tuoi dati…</p>
    </div>
  )
}

function EmptyDashboard({
  income, currency, onAddExpense, onManageCategories,
}: {
  income: number
  currency: string
  onAddExpense: () => void
  onManageCategories: () => void
}) {
  return (
    <div className="card flex flex-col items-center text-center py-12 px-6 max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mb-5 shadow-card-lg">
        <TrendingDown size={28} className="text-white" />
      </div>
      <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Benvenuto in PayStats</h2>
      <p className="text-surface-500 dark:text-surface-400 mt-2 max-w-sm">
        Inizia a tracciare le tue spese: aggiungi la prima per veder comparire grafici,
        budget e insight sulle tue abitudini.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
        <button className="btn-primary justify-center" onClick={onAddExpense}>
          <Plus size={16} /> Aggiungi la prima spesa
        </button>
        <button className="btn-secondary justify-center" onClick={onManageCategories}>
          <Tag size={16} /> Gestisci categorie
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-surface-100 dark:border-surface-800 w-full">
        <p className="text-xs text-surface-400 dark:text-surface-500">
          Reddito mensile impostato: <span className="font-semibold text-surface-600 dark:text-surface-300">{formatMoney(income, currency)}</span>
          {' '}· puoi cambiarlo dalle impostazioni ⚙️
        </p>
      </div>
    </div>
  )
}

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
