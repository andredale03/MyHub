# Deploy su Vercel

## Step 0 — Prepara il repository

Vercel si aggancia a un repository GitHub, quindi il progetto deve essere prima
sotto git e pushato:

```bash
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<utente>/<repo>.git
git push -u origin main
```

> `.gitignore` esclude già `node_modules`, `dist` e `.env` (resta solo
> `.env.example`). Verifica con `git status` che nessun file `.env` con segreti
> venga tracciato.

## Prima volta

1. Pusha il progetto su GitHub (vedi Step 0)
2. Vai su [vercel.com](https://vercel.com) → **Add New Project**
3. Importa il repository GitHub
4. Vercel rileva automaticamente Vite — nessuna configurazione di build necessaria
5. Aggiungi le **variabili d'ambiente** (vedi sotto)
6. Clicca **Deploy**

Il dominio assegnato sarà tipo `myhub-xxx.vercel.app`. Puoi rinominarlo in
**Settings → Domains**.

> **Versione di Node**: il progetto pinna Node 22 (`engines.node` in
> `package.json` + `.nvmrc`); Vercel rispetta questo valore. Vite 5 funziona
> comunque da Node 18 in su. In locale usa `nvm use` per allinearti.

## Funzioni serverless (`api/`)

Vercel rileva automaticamente la cartella `api/` come **Serverless Functions**,
anche se il progetto frontend è statico (Vite). I file con prefisso `_`
(`api/_lib/…`) sono helper condivisi, non route. Le dipendenze runtime delle
funzioni (`stripe`, `@supabase/supabase-js`) sono in `dependencies`, così Vercel
le include nel bundle. I `rewrites` in `vercel.json` instradano tutto su
`index.html` **tranne** `/api`.

## Monorepo: un solo deploy

Da quando le app sono moduli interni alla shell, **l'intero hub (incluso PayStats)
è un unico progetto Vercel**. Non servono più deploy separati per le singole app.
Le app esterne (semplici link) restano l'eccezione: vivono dove vuoi e si
configurano col campo `url`.

## Variabili d'ambiente

| Variabile | Lato | Valore |
|-----------|------|--------|
| `VITE_SUPABASE_URL` | frontend | Project URL da Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | frontend | anon public key da Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | server | service_role key da Supabase → Settings → API (mai esposta!) |
| `SUPABASE_URL` | server | opzionale; se assente le funzioni usano `VITE_SUPABASE_URL` |
| `STRIPE_SECRET_KEY` | server | chiave segreta Stripe (`sk_test_…` / `sk_live_…`) |
| `STRIPE_PRICE_ID` | server | ID del Price ricorrente dell'abbonamento (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | server | segreto di firma del webhook (`whsec_…`) |
| `PUBLIC_SITE_URL` | server | URL pubblico, fallback per i redirect di Checkout |

In Vercel: **Project → Settings → Environment Variables**.

- Le variabili **frontend** (`VITE_*`) sono incluse nel bundle: sicure perché la
  anon key è protetta dalle RLS. Senza di esse l'hub gira in **modalità demo**
  (nessun login, tutte le app accessibili).
- Le variabili **server** sono usate solo dalle Serverless Functions in `api/` e
  non finiscono mai nel browser. Senza le variabili Stripe, le funzioni di
  pagamento rispondono con un errore chiaro invece di crashare.

> ⚠️ Non committare mai il file `.env` (è in `.gitignore`). Usa `.env.example`
> come riferimento. La `service_role` e la `STRIPE_SECRET_KEY` non vanno **mai**
> messe in variabili `VITE_*`.

## Configurare Supabase (una volta)

1. Crea un progetto su [supabase.com](https://supabase.com)
2. SQL Editor → incolla ed esegui [`supabase/schema.sql`](../supabase/schema.sql)
3. Authentication → Providers → abilita **Email** (e disattiva la conferma email
   in sviluppo, se preferisci)
4. Copia URL e anon key in `.env` (locale) e nelle env di Vercel (produzione)
5. **Nomina il primo admin**: registrati dall'app, poi nel SQL Editor esegui
   `update public.profiles set is_admin = true where email = 'tua-email';`
   Quell'account potrà gestire il catalogo da `/admin`.

## Configurare Stripe (una volta)

L'hub usa **Stripe Checkout** (pagina di pagamento ospitata) per l'abbonamento e
un **webhook** che mirrora lo stato dell'abbonamento su Supabase.

1. Crea un account su [stripe.com](https://stripe.com) e resta in **Test mode**
   finché non sei pronto per la produzione.
2. **Prodotto e prezzo**: Dashboard → Products → crea un prodotto (es. "MyHub")
   con un **Price ricorrente** (mensile). Copia l'ID del price (`price_…`) in
   `STRIPE_PRICE_ID`.
3. **Chiave segreta**: Developers → API keys → copia la *Secret key* (`sk_test_…`)
   in `STRIPE_SECRET_KEY`.
4. **Webhook**: Developers → Webhooks → *Add endpoint*:
   - URL: `https://<tuo-dominio>/api/stripe-webhook`
   - Eventi: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copia il *Signing secret* (`whsec_…`) in `STRIPE_WEBHOOK_SECRET`.
5. Aggiungi tutte le variabili Stripe e `SUPABASE_SERVICE_ROLE_KEY` nelle env di
   Vercel, poi rifai il deploy.

### Test locale del webhook

Con la [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
# il comando stampa un whsec_… da usare in STRIPE_WEBHOOK_SECRET locale
stripe trigger checkout.session.completed
```

> Il webhook richiede il **body grezzo** per verificare la firma: la funzione
> disabilita il body parser (`config.api.bodyParser = false`). Da verificare sul
> deploy reale che il raw body arrivi intatto.

## Deploy successivi

Ogni push su `main` triggera automaticamente un nuovo deploy.

## Build locale

```bash
npm run build       # genera dist/
npm run preview     # preview del build su localhost:4173
```
