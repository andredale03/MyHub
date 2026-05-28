# Changelog

Log delle modifiche significative al progetto.

## 2026-05-28 — Catalogo da Supabase, tema unificato, form admin

### Form admin: tipo app (interna/esterna)
- `AdminPage` ora permette di scegliere il **tipo** dell'app: *Interna* (campo
  `route`, montata nella shell) o *Esterna* (campo `url`, link in nuovo tab), con
  validazione coerente e normalizzazione al salvataggio. La lista mostra `↪ route`
  per le app interne.

### Tema unificato hub ↔ app figlie
- Nuovo `src/lib/theme.ts`: sorgente di verità unica sulla chiave `hub-theme`
  (helper + hook `useTheme`), con migrazione dalla storica `paystats_theme`.
- `App.tsx` usa il nuovo hook; `apps/paystats/hooks/useTheme.ts` allineato alla
  stessa chiave. Il tema resta sincronizzato navigando tra hub e PayStats.

### Catalogo servito da Supabase
- Nuova `fetchApps()` in `src/storage.ts`: legge la tabella `apps` di Supabase
  (mappa `sort_order` → `order`) con cache in localStorage e fallback a
  `loadApps()` in demo/errore.
- `App.tsx` mostra subito la cache locale e poi aggiorna dai dati remoti.

### Documentazione
- Aggiornati `architecture.md` (flusso catalogo, tema, debito tecnico),
  `data-model.md` (origine catalogo + sezione Tema), `adding-apps.md` (tipo app
  nel form admin + catalogo Supabase).

## 2026-05-28 — Pagamenti Stripe (Checkout + webhook)

Abbonamento all'hub gestito con Stripe Checkout e sincronizzazione dello stato
su Supabase via webhook.

### Backend (Vercel Serverless Functions)
- Aggiunte dipendenze `stripe` e `@vercel/node`; nuovo `vercel.json` con i
  rewrite SPA che escludono `/api`.
- `api/_lib/stripe.ts`: client Stripe lato server (null se la chiave manca).
- `api/_lib/supabaseAdmin.ts`: client service-role + `getUserFromToken()` per
  autenticare le richieste tramite il Bearer token Supabase.
- `api/create-checkout-session.ts`: crea/riusa il customer Stripe (salvato in
  `profiles.stripe_customer_id`) e apre una Checkout Session in modalità
  `subscription`, ritornando l'URL di pagamento.
- `api/stripe-webhook.ts`: verifica la firma sul body grezzo
  (`bodyParser: false`) e aggiorna `subscription_status` /
  `subscription_current_period_end` su `checkout.session.completed`,
  `customer.subscription.updated` e `…deleted`.

### Frontend
- `src/lib/billing.ts`: `startCheckout()` invia il token Supabase a
  `/api/create-checkout-session` e reindirizza alla pagina Stripe.
- `src/auth/AccountPage.tsx`: pulsante "Attiva abbonamento" funzionante (con
  stato di caricamento ed errori) e gestione del ritorno `?checkout=success/cancel`
  con refresh del profilo (ritentato perché il webhook è asincrono).

### Documentazione e config
- `.env.example`: aggiunte le variabili server (`SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`,
  `PUBLIC_SITE_URL`).
- `deployment.md`: tabella env aggiornata (lato frontend/server) e guida
  "Configurare Stripe" con setup prodotto/price/webhook e test con Stripe CLI.

## 2026-05-28 — Da launcher a piattaforma (monorepo + auth)

Trasformazione dell'hub da semplice vetrina di link a piattaforma con app integrate
e accesso ad abbonamento.

### Fusione di PayStats nel monorepo
- Importato il sorgente di PayStats in `src/apps/paystats/` (componenti, hook,
  context, storage, types) come modulo interno autosufficiente.
- Aggiunto `src/apps/paystats/index.tsx` che monta l'app nel suo `ToastProvider`.
- PayStats ora si apre **dentro** l'hub alla route `/app/paystats` (lazy-loaded),
  non più in un tab esterno.
- Aggiunto `AppFrame` con pulsante flottante "← Hub".
- Esteso `AppEntry` con il campo opzionale `route`; le card con `route` navigano
  internamente, quelle con `url` aprono un tab esterno.

### Unificazione styling
- Aggiunte a `tailwind.config.js` la palette `surface`, le ombre `card`/`card-lg`
  e il raggio `xl2`.
- Portate in `src/index.css` le classi componente condivise (`.card`, `.btn-*`,
  `.chip`, `.input`, `.label`, `.badge`, scrollbar, `sheet-slide-up`).

### Autenticazione ed entitlement (Supabase)
- Aggiunte dipendenze: `@supabase/supabase-js`, `recharts`, `date-fns`, `tslib`.
- `src/lib/supabase.ts`: client opzionale (null se env assenti → modalità demo).
- `src/auth/AuthContext.tsx`: sessione, profilo, stato abbonamento, `hasAccess()`.
- `src/auth/RequireAccess.tsx`: guardia di route (login + abbonamento attivo).
- Pagine `/login` e `/account`; pulsante account nell'header dell'hub.
- Modello "tutto incluso" (stile Setapp): abbonamento attivo → tutte le app.
- `supabase/schema.sql`: tabelle `profiles`, `apps`, `entitlements` con RLS e
  trigger di creazione profilo alla registrazione.
- `.env.example`, `src/vite-env.d.ts`, `.env*` aggiunto a `.gitignore`.

### Documentazione
- Riscritti `architecture.md`, `adding-apps.md`, `README.md`, `deployment.md`.
- Nuovo `data-model.md`. Nota sulle classi condivise in `design-system.md`.

### Da fare (milestone successive)
- Pagamenti Stripe (Checkout + webhook che aggiorna `subscription_status`).
- Migrazione dei dati di PayStats a Supabase per-utente (sync multi-dispositivo).
- Unificazione del tema tra hub e app figlie.
- Campo `route` nel form admin; catalogo app servito da Supabase.
