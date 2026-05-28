import type { VercelRequest, VercelResponse } from '@vercel/node'
import { stripe, STRIPE_PRICE_ID } from './_lib/stripe'
import { supabaseAdmin, getUserFromToken } from './_lib/supabaseAdmin'

/**
 * POST /api/create-checkout-session
 * Header: Authorization: Bearer <supabase access token>
 * Crea (o riusa) il customer Stripe dell'utente e apre una Checkout Session
 * in modalità abbonamento. Ritorna { url } a cui reindirizzare il browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }
  if (!stripe || !STRIPE_PRICE_ID || !supabaseAdmin) {
    return res.status(500).json({ error: 'Stripe non è configurato sul server.' })
  }

  const user = await getUserFromToken(req.headers.authorization)
  if (!user) {
    return res.status(401).json({ error: 'Non autenticato.' })
  }

  try {
    // Recupera o crea il customer Stripe, memorizzandolo su profiles.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id as string | null | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const origin =
      (req.headers.origin as string | undefined) ||
      process.env.PUBLIC_SITE_URL ||
      `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      allow_promotion_codes: true,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return res.status(500).json({ error: message })
  }
}
