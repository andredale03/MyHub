import { useState, useCallback, useEffect } from 'react'
import { storage, DEFAULT_SETTINGS } from '../storage'
import type { Workout, Session, GymRole, Unit } from '../types'
// GyMode è un modulo della shell: per la sync per-utente usa l'auth dell'hub.
import { useAuth } from '../../../auth/AuthContext'
import {
  loadAll,
  upsertWorkoutRemote, deleteWorkoutRemote,
  upsertSessionRemote, deleteSessionRemote,
  saveSettingsRemote,
} from '../remote'

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useGymode() {
  const { configured, user } = useAuth()
  const userId = user?.id ?? null
  const remote = configured && Boolean(userId)

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [role, setRoleState] = useState<GymRole>(DEFAULT_SETTINGS.role)
  const [unit, setUnitState] = useState<Unit>(DEFAULT_SETTINGS.unit)
  const [loading, setLoading] = useState<boolean>(remote)

  useEffect(() => {
    let cancelled = false
    if (remote && userId) {
      setLoading(true)
      loadAll(userId)
        .then(data => {
          if (cancelled) return
          setWorkouts(data.workouts)
          setSessions(data.sessions)
          setRoleState(data.settings.role)
          setUnitState(data.settings.unit)
          setLoading(false)
        })
        .catch(() => { if (!cancelled) setLoading(false) })
    } else {
      setWorkouts(storage.getWorkouts())
      setSessions(storage.getSessions())
      const s = storage.getSettings()
      setRoleState(s.role)
      setUnitState(s.unit)
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [remote, userId])

  // ── schede ──────────────────────────────────────────────────────────────────
  const saveWorkout = useCallback((w: Workout) => {
    setWorkouts(prev => {
      const exists = prev.some(x => x.id === w.id)
      const next = exists ? prev.map(x => x.id === w.id ? w : x) : [...prev, w]
      if (!remote) storage.saveWorkouts(next)
      return next
    })
    if (remote && userId) void upsertWorkoutRemote(userId, w)
  }, [remote, userId])

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => {
      const next = prev.filter(x => x.id !== id)
      if (!remote) storage.saveWorkouts(next)
      return next
    })
    if (remote && userId) void deleteWorkoutRemote(userId, id)
  }, [remote, userId])

  // ── sessioni (esecuzione) ─────────────────────────────────────────────────────
  const saveSession = useCallback((s: Session) => {
    setSessions(prev => {
      const exists = prev.some(x => x.id === s.id)
      const next = exists ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev]
      if (!remote) storage.saveSessions(next)
      return next
    })
    if (remote && userId) void upsertSessionRemote(userId, s)
  }, [remote, userId])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(x => x.id !== id)
      if (!remote) storage.saveSessions(next)
      return next
    })
    if (remote && userId) void deleteSessionRemote(userId, id)
  }, [remote, userId])

  // ── impostazioni ──────────────────────────────────────────────────────────────
  const persistSettings = useCallback((next: { role: GymRole; unit: Unit }) => {
    if (remote && userId) void saveSettingsRemote(userId, next)
    else storage.saveSettings(next)
  }, [remote, userId])

  const setRole = useCallback((r: GymRole) => {
    setRoleState(r)
    persistSettings({ role: r, unit })
  }, [persistSettings, unit])

  const setUnit = useCallback((u: Unit) => {
    setUnitState(u)
    persistSettings({ role, unit: u })
  }, [persistSettings, role])

  const resetToDemo = useCallback(() => {
    if (remote) return
    storage.resetToDemo()
    window.location.reload()
  }, [remote])

  return {
    workouts, sessions, role, unit, loading,
    saveWorkout, deleteWorkout, saveSession, deleteSession,
    setRole, setUnit, resetToDemo,
  }
}
