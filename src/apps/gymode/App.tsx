import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell, ClipboardList, History, User, Settings as SettingsIcon,
  Plus, Pencil, Trash2, ChevronLeft, Play, Check,
} from 'lucide-react'
import type { Workout, WorkoutDay } from './types'
import { useGymode } from './hooks/useGymode'
import { useTheme } from '../../lib/theme'
import { formatWeight } from './format'
import { WorkoutEditor } from './components/WorkoutEditor'
import { ExecuteSession } from './components/ExecuteSession'
import { Sheet } from './components/Sheet'

type View = 'plans' | 'history'

export default function App() {
  const {
    workouts, sessions, role, unit, loading,
    saveWorkout, deleteWorkout, saveSession, deleteSession,
    setRole, setUnit, resetToDemo,
  } = useGymode()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [view, setView] = useState<View>('plans')
  const [detail, setDetail] = useState<Workout | null>(null)
  const [editing, setEditing] = useState<Workout | null>(null)
  const [creating, setCreating] = useState(false)
  const [executing, setExecuting] = useState<{ workout: Workout; day: WorkoutDay } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isPersonal = role === 'personal'
  // tiene il dettaglio allineato all'eventuale modifica della scheda
  const detailLive = detail ? workouts.find(w => w.id === detail.id) ?? null : null

  const openCard = (w: Workout) => {
    if (isPersonal) setEditing(w)
    else setDetail(w)
  }

  return (
    <div className="h-[100dvh] overflow-hidden flex bg-surface-50 dark:bg-surface-950 transition-colors duration-200">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 p-5 shrink-0">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
            <Dumbbell size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-surface-900 dark:text-surface-50">GyMode</span>
        </div>
        <nav className="space-y-1 flex-1">
          <NavItem icon={<ClipboardList size={18} />} label="Schede" active={view === 'plans' && !detail} onClick={() => { setView('plans'); setDetail(null) }} />
          {!isPersonal && <NavItem icon={<History size={18} />} label="Storico" active={view === 'history'} onClick={() => { setView('history'); setDetail(null) }} />}
        </nav>
        {isPersonal && (
          <button className="btn-primary justify-center" onClick={() => setCreating(true)}><Plus size={16} /> Nuova scheda</button>
        )}
        <button className="btn-ghost justify-start mt-2" onClick={() => setSettingsOpen(true)}><SettingsIcon size={18} /> Impostazioni</button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col h-[100dvh] overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-5 pb-3 pt-[calc(1.25rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-50">GyMode</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
              {isPersonal ? 'Personal' : 'Utente'}
            </span>
          </div>
          <button className="btn-ghost p-2.5 rounded-xl" onClick={() => setSettingsOpen(true)} aria-label="Impostazioni"><SettingsIcon size={18} /></button>
        </header>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-4 md:py-8 max-w-3xl mx-auto">
            {loading ? (
              <Loader />
            ) : detailLive ? (
              <WorkoutDetailView
                workout={detailLive} unit={unit} isPersonal={isPersonal}
                onBack={() => setDetail(null)}
                onEdit={() => setEditing(detailLive)}
                onExecute={(day) => setExecuting({ workout: detailLive, day })}
              />
            ) : view === 'history' ? (
              <HistoryView sessions={sessions} unit={unit} onDelete={deleteSession} />
            ) : (
              <PlansView
                workouts={workouts} isPersonal={isPersonal}
                onOpen={openCard} onNew={() => setCreating(true)}
                onDelete={deleteWorkout}
              />
            )}
          </div>
        </div>

        {/* Bottom nav mobile */}
        <nav className="md:hidden shrink-0 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 flex items-center h-16 transition-colors pb-[env(safe-area-inset-bottom)] box-content">
          <MobileNavItem icon={<ClipboardList size={20} />} label="Schede" active={view === 'plans' && !detail} onClick={() => { setView('plans'); setDetail(null) }} />
          {isPersonal ? (
            <CenterAction onClick={() => setCreating(true)} />
          ) : (
            <MobileNavItem icon={<History size={20} />} label="Storico" active={view === 'history'} onClick={() => { setView('history'); setDetail(null) }} />
          )}
          <MobileNavItem icon={<User size={20} />} label="Account" onClick={() => navigate('/account')} />
        </nav>
      </main>

      {/* Modali */}
      {(creating || editing) && (
        <WorkoutEditor
          initial={editing}
          onSave={saveWorkout}
          onClose={() => { setCreating(false); setEditing(null) }}
        />
      )}
      {executing && (
        <ExecuteSession
          workout={executing.workout} day={executing.day} unit={unit}
          onSave={(s) => { saveSession(s); setExecuting(null) }}
          onClose={() => setExecuting(null)}
        />
      )}
      {settingsOpen && (
        <Sheet title="Impostazioni" onClose={() => setSettingsOpen(false)}>
          <div className="space-y-5">
            <Segmented label="Modalità" value={role} options={[['user', 'Utente'], ['personal', 'Personal']]} onChange={v => setRole(v as typeof role)} />
            <Segmented label="Unità di peso" value={unit} options={[['kg', 'kg'], ['lb', 'lb']]} onChange={v => setUnit(v as typeof unit)} />
            <Segmented label="Tema" value={theme} options={[['light', 'Chiaro'], ['dark', 'Scuro']]} onChange={v => { if (v !== theme) toggleTheme() }} />
            <button
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-red-300 hover:text-red-600 transition-colors"
              onClick={() => { if (window.confirm('Ripristinare i dati demo? Le schede e le sessioni locali saranno cancellate.')) resetToDemo() }}
            >
              <Trash2 size={15} /> Ripristina dati demo
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

// ── Viste ──────────────────────────────────────────────────────────────────────

function PlansView({ workouts, isPersonal, onOpen, onNew, onDelete }: {
  workouts: Workout[]; isPersonal: boolean
  onOpen: (w: Workout) => void; onNew: () => void; onDelete: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">Schede</h1>
          <p className="text-sm text-surface-400 dark:text-surface-500">
            {isPersonal ? 'Crea e gestisci le schede di allenamento.' : 'Scegli una scheda e allenati.'}
          </p>
        </div>
        {isPersonal && <button className="btn-primary hidden md:inline-flex" onClick={onNew}><Plus size={15} /> Nuova</button>}
      </div>

      {workouts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-2xl mx-auto mb-3">🏋️</div>
          <p className="text-surface-500 dark:text-surface-400 font-medium">Nessuna scheda</p>
          {isPersonal
            ? <button className="btn-primary mt-4 justify-center mx-auto" onClick={onNew}><Plus size={15} /> Crea la prima scheda</button>
            : <p className="text-sm text-surface-400 mt-1">Chiedi al tuo personal di crearne una.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map(w => (
            <div key={w.id} className="card flex items-center gap-4 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors" onClick={() => onOpen(w)}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${w.color} flex items-center justify-center text-2xl shadow-card-lg shrink-0`}>{w.icon}</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-surface-900 dark:text-surface-50 truncate">{w.name}</h2>
                <p className="text-xs text-surface-400 dark:text-surface-500 truncate">
                  {w.days.length} {w.days.length === 1 ? 'giorno' : 'giorni'} · {w.days.reduce((n, d) => n + d.exercises.length, 0)} esercizi
                </p>
              </div>
              {isPersonal ? (
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button className="btn-ghost p-2" onClick={() => onOpen(w)} aria-label="Modifica"><Pencil size={15} /></button>
                  <button className="btn-danger p-2" onClick={() => { if (window.confirm(`Eliminare "${w.name}"?`)) onDelete(w.id) }} aria-label="Elimina"><Trash2 size={15} /></button>
                </div>
              ) : (
                <Play size={18} className="text-brand-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkoutDetailView({ workout, unit, isPersonal, onBack, onEdit, onExecute }: {
  workout: Workout; unit: string; isPersonal: boolean
  onBack: () => void; onEdit: () => void; onExecute: (day: WorkoutDay) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button className="btn-ghost p-2 rounded-xl" onClick={onBack} aria-label="Indietro"><ChevronLeft size={18} /></button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${workout.color} flex items-center justify-center text-xl shrink-0`}>{workout.icon}</div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-surface-900 dark:text-surface-50 truncate">{workout.name}</h1>
          {workout.description && <p className="text-xs text-surface-400 truncate">{workout.description}</p>}
        </div>
        {isPersonal && <button className="btn-secondary" onClick={onEdit}><Pencil size={14} /> Modifica</button>}
      </div>

      <div className="space-y-4">
        {workout.days.map(day => (
          <div key={day.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-surface-900 dark:text-surface-50">{day.name}</h2>
              {!isPersonal && (
                <button className="btn-primary text-sm" onClick={() => onExecute(day)}><Play size={14} /> Esegui</button>
              )}
            </div>
            <div className="space-y-1.5">
              {day.exercises.map(ex => (
                <div key={ex.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-surface-50 dark:border-surface-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-surface-800 dark:text-surface-100 truncate">{ex.name}</p>
                    {ex.muscle && <p className="text-[10px] text-surface-400 uppercase tracking-wide">{ex.muscle}</p>}
                  </div>
                  <span className="text-xs font-medium text-surface-500 dark:text-surface-400 shrink-0 tabular-nums">
                    {ex.sets}×{ex.reps}{ex.weight ? ` · ${formatWeight(ex.weight, unit as 'kg' | 'lb')}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryView({ sessions, unit, onDelete }: {
  sessions: import('./types').Session[]; unit: string; onDelete: (id: string) => void
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-1">Storico</h1>
      <p className="text-sm text-surface-400 dark:text-surface-500 mb-4">Le tue sessioni completate.</p>
      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-2xl mx-auto mb-3">📋</div>
          <p className="text-surface-500 dark:text-surface-400 font-medium">Nessuna sessione</p>
          <p className="text-sm text-surface-400 mt-1">Esegui una scheda per registrarla qui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const done = s.entries.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0)
            const tot = s.entries.reduce((n, e) => n + e.sets.length, 0)
            const vol = s.entries.reduce((sum, e) => sum + e.sets.reduce((a, x) => a + (x.done ? (x.weight ?? 0) * (x.reps ?? 0) : 0), 0), 0)
            return (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"><Check size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{s.workoutName} · {s.dayName}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {new Date(s.date).toLocaleDateString('it-IT')} · {done}/{tot} serie{vol > 0 ? ` · vol. ${formatWeight(vol, unit as 'kg' | 'lb')}` : ''}
                  </p>
                </div>
                <button className="btn-danger p-2 shrink-0" onClick={() => onDelete(s.id)} aria-label="Elimina"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── elementi UI ─────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-surface-200 dark:border-surface-700 border-t-brand-500 animate-spin mb-4" />
      <p className="text-sm text-surface-400">Carico i tuoi dati…</p>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
      {icon}{label}
    </button>
  )
}
function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 ${active ? 'text-brand-500' : 'text-surface-400 dark:text-surface-500'}`}>
      {icon}<span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
function CenterAction({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center" aria-label="Nuova scheda">
      <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-card-lg -mt-5 active:scale-95 transition-transform">
        <Plus size={22} className="text-white" />
      </div>
    </button>
  )
}
function Segmented({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="inline-flex w-full rounded-xl border border-surface-200 dark:border-surface-700 p-0.5 bg-surface-50 dark:bg-surface-800">
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${value === val ? 'bg-brand-500 text-white' : 'text-surface-500 dark:text-surface-400'}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}
