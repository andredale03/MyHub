import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import type { Workout, WorkoutDay, PlanExercise } from '../types'
import { EXERCISE_LIBRARY } from '../storage'
import { uid } from '../hooks/useGymode'
import { Sheet } from './Sheet'

const COLORS = [
  'from-rose-500 to-orange-600', 'from-indigo-500 to-purple-600', 'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600', 'from-amber-500 to-orange-600', 'from-violet-500 to-fuchsia-600',
]
const ICONS = ['🏋️', '💪', '🔥', '🦵', '🏃', '🧘', '⚡', '🥇']
const ALL_EXERCISE_NAMES = EXERCISE_LIBRARY.flatMap(g => g.names)

interface Props {
  initial?: Workout | null
  onSave: (w: Workout) => void
  onClose: () => void
}

function blankExercise(): PlanExercise {
  return { id: uid(), name: '', muscle: '', sets: 3, reps: '10', weight: undefined, rest: '90s', notes: '' }
}
function blankDay(n: number): WorkoutDay {
  return { id: uid(), name: `Giorno ${String.fromCharCode(64 + n)}`, exercises: [blankExercise()] }
}

export function WorkoutEditor({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0])
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [days, setDays] = useState<WorkoutDay[]>(initial?.days?.length ? initial.days : [blankDay(1)])
  const [openDay, setOpenDay] = useState<string | null>(days[0]?.id ?? null)

  const patchDay = (dayId: string, patch: Partial<WorkoutDay>) =>
    setDays(ds => ds.map(d => d.id === dayId ? { ...d, ...patch } : d))
  const patchExercise = (dayId: string, exId: string, patch: Partial<PlanExercise>) =>
    setDays(ds => ds.map(d => d.id !== dayId ? d : { ...d, exercises: d.exercises.map(e => e.id === exId ? { ...e, ...patch } : e) }))
  const addExercise = (dayId: string) =>
    setDays(ds => ds.map(d => d.id !== dayId ? d : { ...d, exercises: [...d.exercises, blankExercise()] }))
  const removeExercise = (dayId: string, exId: string) =>
    setDays(ds => ds.map(d => d.id !== dayId ? d : { ...d, exercises: d.exercises.filter(e => e.id !== exId) }))
  const addDay = () => { const d = blankDay(days.length + 1); setDays(ds => [...ds, d]); setOpenDay(d.id) }
  const removeDay = (dayId: string) => setDays(ds => ds.filter(d => d.id !== dayId))

  const save = () => {
    if (!name.trim()) return
    const clean = days
      .map(d => ({ ...d, exercises: d.exercises.filter(e => e.name.trim()) }))
      .filter(d => d.exercises.length > 0)
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      description: description.trim() || undefined,
      icon, color,
      days: clean.length ? clean : days,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Sheet
      title={initial ? 'Modifica scheda' : 'Nuova scheda'}
      subtitle="Imposta giorni ed esercizi"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={!name.trim()}>Salva scheda</button>
        </>
      }
    >
      <datalist id="gym-ex-names">{ALL_EXERCISE_NAMES.map(n => <option key={n} value={n} />)}</datalist>

      <div className="space-y-4">
        <div>
          <label className="label">Nome scheda</label>
          <input className="input" placeholder="Es. Full Body 3x" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Descrizione</label>
          <input className="input" placeholder="Note generali…" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Icona</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center ${icon === ic ? 'bg-brand-100 dark:bg-brand-900/40 ring-2 ring-brand-400' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Colore</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c} ${color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-surface-900' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Giorni */}
        <div className="space-y-3 pt-2">
          {days.map((day) => {
            const open = openDay === day.id
            return (
              <div key={day.id} className="rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-800/50">
                  <button className="btn-ghost p-1 shrink-0" onClick={() => setOpenDay(open ? null : day.id)} aria-label="Espandi">
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <input
                    className="flex-1 bg-transparent text-sm font-semibold text-surface-900 dark:text-surface-50 outline-none min-w-0"
                    value={day.name}
                    onChange={e => patchDay(day.id, { name: e.target.value })}
                  />
                  <span className="text-xs text-surface-400 shrink-0">{day.exercises.length} es.</span>
                  {days.length > 1 && (
                    <button className="btn-danger p-1.5 shrink-0" onClick={() => removeDay(day.id)} aria-label="Elimina giorno"><Trash2 size={14} /></button>
                  )}
                </div>

                {open && (
                  <div className="p-3 space-y-3">
                    {day.exercises.map((ex, ei) => (
                      <div key={ex.id} className="rounded-xl border border-surface-100 dark:border-surface-800 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-surface-400 w-5 shrink-0">{ei + 1}.</span>
                          <input
                            list="gym-ex-names"
                            className="input py-1.5 text-sm flex-1"
                            placeholder="Nome esercizio"
                            value={ex.name}
                            onChange={e => patchExercise(day.id, ex.id, { name: e.target.value })}
                          />
                          <button className="btn-danger p-1.5 shrink-0" onClick={() => removeExercise(day.id, ex.id)} aria-label="Rimuovi"><Trash2 size={14} /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <NumberField label="Serie" value={ex.sets} onChange={v => patchExercise(day.id, ex.id, { sets: v })} />
                          <TextField label="Rip." value={ex.reps} onChange={v => patchExercise(day.id, ex.id, { reps: v })} />
                          <NumberField label="Peso" value={ex.weight} onChange={v => patchExercise(day.id, ex.id, { weight: v })} />
                          <TextField label="Rec." value={ex.rest ?? ''} onChange={v => patchExercise(day.id, ex.id, { rest: v })} />
                        </div>
                      </div>
                    ))}
                    <button className="btn-secondary w-full justify-center text-sm" onClick={() => addExercise(day.id)}>
                      <Plus size={15} /> Esercizio
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <button className="btn-ghost w-full justify-center" onClick={addDay}>
            <Dumbbell size={15} /> Aggiungi giorno
          </button>
        </div>
      </div>
    </Sheet>
  )
}

function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-surface-400 uppercase mb-1">{label}</label>
      <input
        className="input py-1.5 text-sm text-center" type="number" inputMode="decimal" min="0"
        value={value ?? ''} onChange={e => { const n = parseFloat(e.target.value); onChange(Number.isNaN(n) ? undefined : n) }}
      />
    </div>
  )
}
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-surface-400 uppercase mb-1">{label}</label>
      <input className="input py-1.5 text-sm text-center" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
