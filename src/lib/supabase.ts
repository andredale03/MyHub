import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True solo se entrambe le variabili d'ambiente sono presenti.
 * Quando è false l'hub gira in "modalità demo": niente login richiesto,
 * tutte le app accessibili. Utile in sviluppo prima di configurare Supabase.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
