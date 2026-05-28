import Stripe from 'stripe'

const secret = process.env.STRIPE_SECRET_KEY

// Client Stripe lato server. Null se la chiave non è configurata, così le
// funzioni possono rispondere con un errore chiaro invece di crashare.
export const stripe: Stripe | null = secret ? new Stripe(secret) : null

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
