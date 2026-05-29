import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import type { Workout, WorkoutDay, Session, ExerciseLog, SetLog, Unit } from '../types'
import { uid } from '../hooks/useGymode'
import { Sheet } from './Sheet'

interface Props {
  workout: Workout
  day: WorkoutDay
  unit: Unit
  onSave: (s: Session) => void
  onClose: () => void
}

export function ExecuteSession({ workout, day, unit, onSave, onClose }: Props) {
  const [entries, setEntries] = useState<ExerciseLog[]>(() =>
    day.exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array.from({ length: Math.max(1, ex.sets) }, () => ({ weight: ex.weight, reps: undefined, done: false })),
    })),
  )

  const patchSet = (exIdx: number, setIdx: number, patch: Partial<SetLog>) =>
    setEntries(es => es.map((e, i) => i !== exIdx ? e : { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, ...patch } : s) }))
  const addSet = (exIdx: number) =>
    setEntries(es => es.map((e, i) => i !== exIdx ? e : { ...e, sets: [...e.sets, { weight: e.sets[e.sets.length - 1]?.weight, reps: undefined, done: false }] }))

  const doneCount = entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)
  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0)

  const save = () => {
    const today = new Date().toISOString().split('T')[0]
    onSave({
      id: uid(),
      workoutId: workout.id,
      workoutName: workout.name,
      dayId: day.id,
      dayName: day.name,
      date: today,
      entries,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Sheet
      title={day.name}
      subtitle={`${workout.name} · ${doneCount}/${totalSets} serie`}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center" onClick={save}>
            <Check size={15} /> Salva sessione
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {entries.map((entry, exIdx) => {
          const plan = day.exercises[exIdx]
          return (
            <div key={entry.exerciseId} className="rounded-2xl border border-surface-100 dark:border-surface-800 p-3">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{entry.name}</h3>
                <span className="text-xs text-surface-400">target {plan.sets}×{plan.reps}{plan.weight ? ` @ ${plan.weight}${unit}` : ''}</span>
              </div>
              <div className="space-y-1.5">
                {entry.sets.map((set, setIdx) => (
                  <div key={setIdx} className={`flex items-center gap-2 rounded-xl p-1.5 ${set.done ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                    <span className="w-6 text-center text-xs font-semibold text-surface-400 shrink-0">{setIdx + 1}</span>
                    <input
                      className="input py-1.5 text-sm text-center flex-1" type="number" inputMode="decimal" placeholder="rip."
                      value={set.reps ?? ''} onChange={e => { const n = parseFloat(e.target.value); patchSet(exIdx, setIdx, { reps: Number.isNaN(n) ? undefined : n }) }}
                    />
                    <span className="text-xs text-surface-400">×</span>
                    <input
                      className="input py-1.5 text-sm text-center flex-1" type="number" inputMode="decimal" placeholder={unit}
                      value={set.weight ?? ''} onChange={e => { const n = parseFloat(e.target.value); patchSet(exIdx, setIdx, { weight: Number.isNaN(n) ? undefined : n }) }}
                    />
                    <button
                      onClick={() => patchSet(exIdx, setIdx, { done: !set.done })}
                      aria-label="Completata"
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${set.done ? 'bg-emerald-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}
                    >
                      <Check size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn-ghost text-xs mt-1.5" onClick={() => addSet(exIdx)}><Plus size={13} /> Serie</button>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
