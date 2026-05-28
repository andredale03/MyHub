import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Client Supabase con service role: bypassa le RLS, quindi va usato SOLO
 * lato server (mai esposto al browser). Serve al webhook per aggiornare
 * profiles e alla funzione di checkout per leggere/salvare lo stripe_customer_id.
 */
export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null

/** Estrae l'utente Supabase dal token Bearer dell'header Authorization. */
export async function getUserFromToken(authHeader?: string) {
  if (!supabaseAdmin) return null
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) return null
  return data.user
}
