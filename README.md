# MyHub

Una **piattaforma** che ospita più mini-app dentro un'unica shell React, con login
condiviso e accesso tramite un abbonamento unico "tutto incluso" (stile Setapp).
Le app non sono siti separati: sono moduli montati come route dentro l'hub.

## Avvio rapido

```bash
nvm use                  # Node 22 (vedi .nvmrc); Vite 5 richiede Node 18+
npm install
cp .env.example .env     # opzionale: compila per attivare login/abbonamento (Supabase)
npm run dev              # http://localhost:5174
```

Senza `.env`, l'hub gira in **modalità demo**: nessun login richiesto, tutte le app
accessibili.

## Funzionalità

- **Shell unica** con catalogo app servito da Supabase (fallback localStorage).
- **Auth + abbonamento** Supabase: un unico abbonamento sblocca tutte le app.
- **Pagamenti Stripe**: Checkout ospitato + webhook che mirrora lo stato su Supabase
  (funzioni serverless in `api/`).
- **Ruolo admin** (`is_admin`): gestione del catalogo da `/admin`, protetta da RLS.
- **PayStats** salva i dati **per-utente** su Supabase (sync multi-dispositivo),
  con fallback a localStorage in demo.
- **Tema** chiaro/scuro condiviso tra hub e app figlie.

## Stack

React 19 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router 7 ·
Supabase (auth + DB) · Stripe · Recharts 2 · lucide-react

## App incluse

| App | Route | Descrizione |
|-----|-------|-------------|
| PayStats | `/app/paystats` | Gestione spese personali: budget, trend, insight |

## Documentazione

Tutta la documentazione è in [`docs/`](docs/README.md):

- [architecture.md](docs/architecture.md) — monorepo, shell, routing, auth
- [data-model.md](docs/data-model.md) — schema Supabase, entitlement, env
- [adding-apps.md](docs/adding-apps.md) — aggiungere un'app interna o esterna
- [deployment.md](docs/deployment.md) — deploy Vercel + setup Supabase
- [design-system.md](docs/design-system.md) — colori, icone, classi condivise
- [CHANGELOG.md](docs/CHANGELOG.md) — storico modifiche

## Setup Supabase (una volta)

1. Crea un progetto su [supabase.com](https://supabase.com)
2. SQL Editor → esegui [`supabase/schema.sql`](supabase/schema.sql)
3. Authentication → abilita il provider **Email**
4. Copia URL e anon key in `.env` (vedi `.env.example`)
5. Registrati dall'app e nomina il tuo admin:
   `update public.profiles set is_admin = true where email = 'tua-email';`

I **pagamenti Stripe** sono opzionali e si configurano a parte (prodotto/price,
webhook, env server). Vedi [docs/deployment.md](docs/deployment.md) per tutti i
dettagli (env, Supabase, Stripe, Node 22).
