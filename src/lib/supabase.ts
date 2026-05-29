import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True solo se entrambe le variabili d'ambiente sono presenti.
 * Quando è false l'hub gira in "modalità demo": niente login richiesto,
 * tutte le app accessibili. Utile in sviluppo prima di configurare Supabase.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Bypass dell'autenticazione: se `VITE_AUTH_BYPASS=true`, le guardie delle app
 * (RequireAccess) lasciano passare senza login né abbonamento, anche con Supabase
 * configurato. Pensato per lo SVILUPPO, per non dover fare login ogni volta.
 * NON abilitarlo in produzione.
 */
export const authBypass = ['true', '1'].includes(
  (import.meta.env.VITE_AUTH_BYPASS ?? '').toLowerCase(),
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        // La sessione (access + refresh token) viene salvata in localStorage e
        // rinnovata automaticamente: una volta autenticato resti loggato anche
        // chiudendo e riaprendo l'app (incluso "aggiungi a Home" sul telefono).
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'myhub-auth',
      },
    })
  : null
