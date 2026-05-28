# Modello dati ed entitlement

## Backend: Supabase

L'autenticazione e i dati di piattaforma vivono su **Supabase** (Postgres + Auth).
Lo schema completo è in [`supabase/schema.sql`](../supabase/schema.sql) e va eseguito
una volta nel **SQL Editor** di Supabase.

### Tabelle

| Tabella | Scopo |
|---------|-------|
| `auth.users` | Utenti (gestita da Supabase Auth) |
| `public.profiles` | Una riga per utente: email + stato abbonamento (mirror di Stripe) |
| `public.apps` | Catalogo delle app dell'hub (lettura pubblica) |
| `public.entitlements` | Accesso granulare per-app (riservato a un futuro modello a pacchetti) |

### `profiles`

```sql
id                               uuid (PK → auth.users.id)
email                            text
subscription_status              text   -- 'active' | 'trialing' | 'canceled' | null
subscription_current_period_end  timestamptz
stripe_customer_id               text
created_at                       timestamptz
```

Una riga viene creata automaticamente alla registrazione tramite il trigger
`on_auth_user_created` → funzione `handle_new_user()`.

### Row Level Security (RLS)

- `profiles`: ogni utente legge/aggiorna **solo** la propria riga (`auth.uid() = id`).
- `apps`: lettura pubblica (catalogo visibile a tutti).
- `entitlements`: ogni utente legge solo i propri.

## Modello di entitlement

Modello **"tutto incluso" (stile Setapp)**: un abbonamento attivo sblocca tutte
le app. La logica è centralizzata in `AuthContext`:

```ts
subscriptionActive = profile.subscription_status ∈ { 'active', 'trialing' }
hasAccess(appId)   = !supabaseConfigurato || subscriptionActive
```

La guardia `RequireAccess` usa `hasAccess` per proteggere le route `/app/*`.

> La tabella `entitlements` esiste già per supportare, in futuro, un modello
> granulare (accesso a singole app o pacchetti) senza modificare le guardie.

## Pagamenti (Stripe) → `profiles`

Lo stato dell'abbonamento in `profiles` è **mirrorato da Stripe**, non scritto dal
browser. Il flusso (dettagli in [architecture.md](architecture.md) e
[deployment.md](deployment.md)):

1. `POST /api/create-checkout-session` crea/riusa il customer Stripe e ne salva
   l'id in `profiles.stripe_customer_id`, poi apre una Checkout Session.
2. Al completamento del pagamento, Stripe invia eventi a `POST /api/stripe-webhook`,
   che (con il `service_role`, bypassando le RLS) aggiorna su `profiles`:
   - `subscription_status` → `sub.status`
   - `subscription_current_period_end` → fine periodo (ISO)
3. La riga è individuata via `eq('stripe_customer_id', customerId)`.

Eventi gestiti: `checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`.

## Configurazione (env)

Il client Supabase **frontend** si attiva solo se sono presenti entrambe le
variabili `VITE_*`; le funzioni server usano in più le chiavi service-role e
Stripe.

| Variabile | Lato | Dove trovarla |
|-----------|------|----------------|
| `VITE_SUPABASE_URL` | frontend | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase → Settings → API → service_role (segreta) |
| `SUPABASE_URL` | server | opzionale; fallback su `VITE_SUPABASE_URL` |
| `STRIPE_SECRET_KEY` | server | Stripe → Developers → API keys |
| `STRIPE_PRICE_ID` | server | Stripe → Products → Price ricorrente |
| `STRIPE_WEBHOOK_SECRET` | server | Stripe → Developers → Webhooks (signing secret) |
| `PUBLIC_SITE_URL` | server | URL pubblico, fallback per i redirect di Checkout |

Copia `.env.example` in `.env` e compila i valori. Senza le `VITE_*` l'hub gira in
**modalità demo** (nessun login, tutte le app accessibili). Senza le variabili
Stripe, le funzioni di pagamento rispondono con un errore chiaro.

### Testare l'accesso senza Stripe

Se non hai ancora configurato Stripe, puoi testare l'accesso manualmente: dopo
esserti registrato, apri la tabella `profiles` su Supabase e imposta
`subscription_status = 'active'` sulla tua riga.

## Dati delle app figlie

Ogni app sotto `src/apps/` mantiene la propria persistenza. **PayStats** usa
`localStorage` con namespace `paystats_`:

| Chiave | Contenuto |
|--------|-----------|
| `paystats_categories` | Categorie di spesa |
| `paystats_expenses` | Spese |
| `paystats_income` | Reddito mensile |
| `paystats_seeded` | Flag dati demo già generati |
| `paystats_theme` | Tema dell'app |

> Migrazione futura: spostare questi dati su tabelle Supabase per-utente
> (sincronizzazione multi-dispositivo). È una milestone a sé.

## Catalogo app (`AppEntry`)

Il catalogo dell'hub è descritto da `AppEntry` (`src/storage.ts`):

```ts
interface AppEntry {
  id: string
  name: string
  description: string
  url: string          // url esterno (usato solo se route è assente)
  route?: string       // route interna alla shell, es. "/app/paystats"
  icon: string         // emoji
  color: string        // gradiente Tailwind
  status: 'live' | 'wip' | 'planned'
  order: number
}
```

Se `route` è presente, la card apre l'app **dentro** l'hub; altrimenti apre `url`
in un nuovo tab.

### Origine del catalogo

`fetchApps()` (`src/storage.ts`) carica il catalogo dalla tabella `apps` di
Supabase quando configurato (mappando `sort_order` → `order`), facendone cache in
localStorage (`hub-apps`). In modalità demo o in caso di errore ricade su
`loadApps()` (localStorage / `DEFAULT_APPS`). La home mostra subito la cache e poi
la sostituisce con i dati remoti.

> L'AdminPage (`/admin`) modifica per ora la copia **locale** (`saveApps`). Scrivere
> il catalogo su Supabase dall'admin è il passo successivo.

## Tema (preferenza UI)

Il tema chiaro/scuro è una preferenza locale con **sorgente di verità unica**: la
chiave `hub-theme` in localStorage, condivisa tra hub e app figlie
(`src/lib/theme.ts`). PayStats legge/scrive la stessa chiave e migra dalla storica
`paystats_theme`, così il tema resta sincronizzato passando tra hub e app.
