import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface Profile {
  id: string
  /** Stato abbonamento mirrorato da Stripe: 'active' | 'trialing' | 'canceled' | null */
  subscription_status: string | null
  /** Fine del periodo corrente (ISO), per mostrare la data di rinnovo. */
  subscription_current_period_end: string | null
}

interface AuthValue {
  /** Supabase è configurato (env presenti). Se false → modalità demo. */
  configured: boolean
  loading: boolean
  user: User | null
  session: Session | null
  profile: Profile | null
  /** L'abbonamento è attivo o in prova → sblocca tutte le app (modello Setapp). */
  subscriptionActive: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Vero se l'utente può aprire l'app indicata. */
  hasAccess: (appId: string) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

const ACTIVE_STATUSES = ['active', 'trialing']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('id, subscription_status, subscription_current_period_end')
      .eq('id', userId)
      .maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) loadProfile(newSession.user.id)
      else setProfile(null)
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase non configurato.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase non configurato.' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  const subscriptionActive = Boolean(
    profile?.subscription_status && ACTIVE_STATUSES.includes(profile.subscription_status),
  )

  // Modello Setapp: un abbonamento attivo sblocca tutte le app del catalogo.
  // In modalità demo (Supabase non configurato) tutto è accessibile.
  const hasAccess = useCallback(
    (_appId: string) => !isSupabaseConfigured || subscriptionActive,
    [subscriptionActive],
  )

  const value: AuthValue = {
    configured: isSupabaseConfigured,
    loading,
    user,
    session,
    profile,
    subscriptionActive,
    signInWithPassword,
    signUp,
    signOut,
    hasAccess,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}
