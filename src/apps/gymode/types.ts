// Modello dati di GyMode.

export type Unit = 'kg' | 'lb'
/** Modalità d'uso: il "personal" crea/modifica le schede, l'"utente" le esegue. */
export type GymRole = 'personal' | 'user'

/** Un esercizio dentro una scheda (valori target impostati dal personal). */
export interface PlanExercise {
  id: string
  name: string
  muscle?: string
  sets: number
  reps: string        // es. "8-12" oppure "10"
  weight?: number     // peso target (opzionale)
  rest?: string       // recupero, es. "90s"
  notes?: string
}

/** Un giorno/sessione della scheda (es. "Giorno A — Push"). */
export interface WorkoutDay {
  id: string
  name: string
  exercises: PlanExercise[]
}

/** Scheda di allenamento creata dal personal. */
export interface Workout {
  id: string
  name: string
  description?: string
  icon: string        // emoji
  color: string       // gradiente Tailwind (es. "from-rose-500 to-orange-600")
  days: WorkoutDay[]
  createdAt: string
}

// ── Esecuzione (lato utente) ──────────────────────────────────────────────────

export interface SetLog {
  reps?: number
  weight?: number
  done: boolean
}

export interface ExerciseLog {
  exerciseId: string
  name: string
  sets: SetLog[]
}

/** Una sessione svolta dall'utente a partire da un giorno di una scheda. */
export interface Session {
  id: string
  workoutId: string
  workoutName: string
  dayId: string
  dayName: string
  date: string        // YYYY-MM-DD
  entries: ExerciseLog[]
  durationMin?: number
  notes?: string
  createdAt: string
}

export interface GymSettings {
  role: GymRole
  unit: Unit
}
