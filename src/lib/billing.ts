import { supabase } from './supabase'

/**
 * Avvia il checkout Stripe per l'abbonamento all'hub.
 * Recupera il token di accesso Supabase, lo invia come Bearer alla funzione
 * serverless /api/create-checkout-session e reindirizza il browser alla
 * Checkout Session ospitata da Stripe.
 *
 * Lancia un Error con messaggio leggibile in caso di problemi (da mostrare
 * all'utente nella UI).
 */
export async function startCheckout(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase non è configurato: impossibile avviare il pagamento.')
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) {
    throw new Error('Sessione scaduta: effettua di nuovo l’accesso.')
  }

  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null

  if (!res.ok || !payload?.url) {
    throw new Error(payload?.error || 'Impossibile avviare il pagamento. Riprova più tardi.')
  }

  // Redirect alla pagina di pagamento ospitata da Stripe.
  window.location.href = payload.url
}
