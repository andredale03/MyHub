import { supabase } from '../../lib/supabase'
import type { Workout, WorkoutDay, Session, GymSettings } from './types'
import { DEFAULT_SETTINGS } from './storage'

export const isRemoteGymode = Boolean(supabase)

// ── mapping righe DB ⇄ tipi app ──────────────────────────────────────────────

interface WorkoutRow {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  days: WorkoutDay[] | null
  created_at: string
}
interface SessionRow { id: string; date: string; data: Session }

function rowToWorkout(r: WorkoutRow): Workout {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    icon: r.icon ?? '🏋️',
    color: r.color ?? 'from-rose-500 to-orange-600',
    days: r.days ?? [],
    createdAt: r.created_at,
  }
}
function workoutToRow(userId: string, w: Workout) {
  return {
    user_id: userId,
    id: w.id,
    name: w.name,
    description: w.description ?? null,
    icon: w.icon,
    color: w.color,
    days: w.days,
    created_at: w.createdAt,
  }
}

export interface GymodeData {
  workouts: Workout[]
  sessions: Session[]
  settings: GymSettings
}

export async function loadAll(userId: string): Promise<GymodeData> {
  if (!supabase) return { workouts: [], sessions: [], settings: DEFAULT_SETTINGS }

  const [wRes, sRes, setRes] = await Promise.all([
    supabase.from('gymode_workouts').select('id, name, description, icon, color, days, created_at').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('gymode_sessions').select('id, date, data').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('gymode_settings').select('role, unit').eq('user_id', userId).maybeSingle(),
  ])

  const workouts = (wRes.data as WorkoutRow[] | null)?.map(rowToWorkout) ?? []
  const sessions = (sRes.data as SessionRow[] | null)?.map(r => r.data) ?? []

  const settingsRow = setRes.data as { role: string; unit: string } | null
  const settings: GymSettings = settingsRow
    ? { role: (settingsRow.role as GymSettings['role']) ?? 'user', unit: (settingsRow.unit as GymSettings['unit']) ?? 'kg' }
    : DEFAULT_SETTINGS
  if (!settingsRow) {
    await supabase.from('gymode_settings').upsert({ user_id: userId, ...DEFAULT_SETTINGS })
  }

  return { workouts, sessions, settings }
}

// ── mutazioni ─────────────────────────────────────────────────────────────────

export async function upsertWorkoutRemote(userId: string, w: Workout) {
  if (!supabase) return
  await supabase.from('gymode_workouts').upsert(workoutToRow(userId, w))
}
export async function deleteWorkoutRemote(userId: string, id: string) {
  if (!supabase) return
  await supabase.from('gymode_workouts').delete().eq('user_id', userId).eq('id', id)
}
export async function upsertSessionRemote(userId: string, s: Session) {
  if (!supabase) return
  await supabase.from('gymode_sessions').upsert({ user_id: userId, id: s.id, date: s.date, data: s })
}
export async function deleteSessionRemote(userId: string, id: string) {
  if (!supabase) return
  await supabase.from('gymode_sessions').delete().eq('user_id', userId).eq('id', id)
}
export async function saveSettingsRemote(userId: string, settings: GymSettings) {
  if (!supabase) return
  await supabase.from('gymode_settings').upsert({ user_id: userId, ...settings })
}
