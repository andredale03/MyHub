import type { Workout, Session, GymSettings } from './types'

const KEYS = {
  workouts: 'gymode_workouts',
  sessions: 'gymode_sessions',
  settings: 'gymode_settings',
  seeded:   'gymode_seeded',
}

export const DEFAULT_SETTINGS: GymSettings = { role: 'user', unit: 'kg' }

/** Suggerimenti per il quick-add nell'editor, raggruppati per gruppo muscolare. */
export const EXERCISE_LIBRARY: { muscle: string; names: string[] }[] = [
  { muscle: 'Petto',    names: ['Panca piana', 'Panca inclinata', 'Croci ai cavi', 'Chest press', 'Dip'] },
  { muscle: 'Schiena',  names: ['Trazioni', 'Lat machine', 'Rematore bilanciere', 'Pulley', 'Stacco da terra'] },
  { muscle: 'Gambe',    names: ['Squat', 'Pressa', 'Leg extension', 'Leg curl', 'Affondi', 'Polpacci'] },
  { muscle: 'Spalle',   names: ['Lento avanti', 'Alzate laterali', 'Alzate frontali', 'Arnold press', 'Face pull'] },
  { muscle: 'Braccia',  names: ['Curl bilanciere', 'Curl manubri', 'French press', 'Push down', 'Hammer curl'] },
  { muscle: 'Core',     names: ['Plank', 'Crunch', 'Russian twist', 'Leg raise'] },
]

const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: 'demo-fullbody',
    name: 'Full Body 3x',
    description: 'Scheda total body per 3 sedute settimanali.',
    icon: '🏋️',
    color: 'from-rose-500 to-orange-600',
    createdAt: new Date().toISOString(),
    days: [
      {
        id: 'd-a', name: 'Giorno A',
        exercises: [
          { id: 'e1', name: 'Squat',          muscle: 'Gambe',   sets: 4, reps: '8-10', weight: 60, rest: '120s' },
          { id: 'e2', name: 'Panca piana',    muscle: 'Petto',   sets: 4, reps: '8-10', weight: 50, rest: '90s' },
          { id: 'e3', name: 'Rematore bilanciere', muscle: 'Schiena', sets: 3, reps: '10', weight: 40, rest: '90s' },
          { id: 'e4', name: 'Plank',          muscle: 'Core',    sets: 3, reps: '45s', rest: '60s' },
        ],
      },
      {
        id: 'd-b', name: 'Giorno B',
        exercises: [
          { id: 'e5', name: 'Stacco da terra', muscle: 'Schiena', sets: 4, reps: '6-8', weight: 70, rest: '150s' },
          { id: 'e6', name: 'Lento avanti',    muscle: 'Spalle',  sets: 4, reps: '8-10', weight: 30, rest: '90s' },
          { id: 'e7', name: 'Trazioni',        muscle: 'Schiena', sets: 3, reps: 'max', rest: '90s' },
          { id: 'e8', name: 'Curl manubri',    muscle: 'Braccia', sets: 3, reps: '12', weight: 12, rest: '60s' },
        ],
      },
    ],
  },
]

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getWorkouts(): Workout[] {
    if (!localStorage.getItem(KEYS.seeded)) {
      write(KEYS.workouts, DEFAULT_WORKOUTS)
      localStorage.setItem(KEYS.seeded, '1')
      return DEFAULT_WORKOUTS
    }
    return read<Workout[]>(KEYS.workouts, [])
  },
  saveWorkouts(w: Workout[]): void { write(KEYS.workouts, w) },

  getSessions(): Session[] { return read<Session[]>(KEYS.sessions, []) },
  saveSessions(s: Session[]): void { write(KEYS.sessions, s) },

  getSettings(): GymSettings { return read<GymSettings>(KEYS.settings, DEFAULT_SETTINGS) },
  saveSettings(s: GymSettings): void { write(KEYS.settings, s) },

  resetToDemo(): void {
    localStorage.removeItem(KEYS.seeded)
    localStorage.removeItem(KEYS.workouts)
    localStorage.removeItem(KEYS.sessions)
  },
}
