import type { VercelRequest, VercelResponse } from '@vercel/node'
import type Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from './_lib/stripe'
import { supabaseAdmin } from './_lib/supabaseAdmin'

// Disabilita il parsing automatico del body: la verifica della firma Stripe
// richiede i byte grezzi della richiesta.
export const config = { api: { bodyParser: false } }

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  // Se per qualche ragione il body è già disponibile come Buffer/stringa, usalo.
  const anyReq = req as unknown as { body?: unknown }
  if (Buffer.isBuffer(anyReq.body)) return anyReq.body
  if (typeof anyReq.body === 'string') return Buffer.from(anyReq.body)

  const chunks: Buffer[] = []
  for await (const chunk of req as unknown as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

/** Estrae la fine periodo dalla subscription in modo robusto fra versioni API. */
function periodEndISO(sub: Stripe.Subscription): string | null {
  const ts = (sub as unknown as { current_period_end?: number }).current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!stripe || !STRIPE_WEBHOOK_SECRET || !supabaseAdmin) {
    return res.status(500).json({ error: 'Stripe non è configurato sul server.' })
  }

  const sig = req.headers['stripe-signature'] as string | undefined
  if (!sig) return res.status(400).json({ error: 'Firma mancante.' })

  let event: Stripe.Event
  try {
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'errore'
    return res.status(400).json({ error: `Verifica firma fallita: ${message}` })
  }

  const updateByCustomer = async (
    customerId: string,
    fields: Record<string, unknown>,
  ) => {
    await supabaseAdmin.from('profiles').update(fields).eq('stripe_customer_id', customerId)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subId = session.subscription as string | null
        if (customerId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await updateByCustomer(customerId, {
            subscription_status: sub.status,
            subscription_current_period_end: periodEndISO(sub),
          })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await updateByCustomer(sub.customer as string, {
          subscription_status: sub.status,
          subscription_current_period_end: periodEndISO(sub),
        })
        break
      }
    }
    return res.status(200).json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'errore'
    return res.status(500).json({ error: message })
  }
}
