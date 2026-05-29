# Changelog

Log delle modifiche significative al progetto.

## 2026-05-29 — Nuova app: GyMode (schede di allenamento)

Seconda app dell'hub, costruita con lo stesso impianto di PayStats (app-shell,
tema slate, backend doppio local/Supabase, personalizzazione).

### Due sezioni per ruolo
- **Personal**: crea e modifica le **schede** (giorni + esercizi con serie,
  ripetizioni, peso, recupero) tramite editor dedicato.
- **Utente**: visualizza le schede, le **esegue** (log delle serie con rip×peso e
  check completata) e consulta lo **storico** delle sessioni.
- Modalità (Personal/Utente) e **unità** (kg/lb) selezionabili dalle impostazioni.

### Struttura (`src/apps/gymode/`)
- `types.ts`, `storage.ts` (localStorage + scheda demo + libreria esercizi),
  `remote.ts` (Supabase per-utente), `hooks/useGymode.ts` (backend doppio come
  `useExpenses`), `format.ts` (peso), `ErrorBoundary`, componenti `Sheet`,
  `WorkoutEditor`, `ExecuteSession`, `App.tsx` (app-shell + bottom nav).
- Route `/app/gymode` (lazy) dietro `RequireAccess`; voce nel catalogo
  (`DEFAULT_APPS` + seed `apps`).
- Schema: tabelle `gymode_workouts` (giorni in JSONB), `gymode_sessions`,
  `gymode_settings` con RLS per-utente.

## 2026-05-29 — Hub: identità (logo) + home in stile launcher

- Nuovo **logo dell'hub** (tessera gradient indaco con griglia 2×2) in
  `public/favicon.svg` → usato come favicon, apple-touch-icon e icona del manifest
  (icona della Home). Componente `HubLogo` inline nell'header.
- Home dell'hub (`src/App.tsx`) ridisegnata in **stile launcher**: ogni app è una
  **tessera-icona** (gradient `color` + emoji `icon`) con nome e descrizione;
  griglia 2/3/4 colonne. Indicatore link esterno e badge stato per app non live.
- Hub convertito ad **app-shell** (header fisso, solo il contenuto scrolla),
  coerente con PayStats; safe-area top sull'header.

## 2026-05-29 — Feel da app: app-shell + niente zoom/scroll involontari

- **App-shell** in PayStats: root e `main` bloccati a `100dvh` con `overflow-hidden`;
  header mobile e bottom nav fanno parte della shell (fissi) e **scrolla solo il
  contenuto centrale** (`flex-1 overflow-y-auto`). `AppFrame` bloccato a `100dvh`.
  Niente più scroll a livello pagina (verificato: `body` non scrolla).
- **Niente zoom**: viewport `maximum-scale=1, user-scalable=no` + `touch-action:
  manipulation`.
- **Niente scroll/overscroll involontari**: `overscroll-behavior: none`
  (no rimbalzo/pull-to-refresh), `overflow-x: hidden`.
- **Niente "feel da sito"**: disattivati selezione testo, tap-highlight e callout
  long-press (riabilitati su input/textarea).

## 2026-05-29 — Paywall abbonamento disattivato (prova privata)

- `AuthContext`: nuovo flag `SUBSCRIPTION_REQUIRED = false`. Con paywall spento
  `hasAccess` non richiede più l'abbonamento: basta essere loggati (o demo/bypass).
- `AccountPage`: nascosti pulsante "Attiva abbonamento" e banner di ritorno Stripe;
  mostrata una nota "accesso libero in fase di prova". Codice Stripe/billing
  invariato e pronto: per riattivare basta rimettere `SUBSCRIPTION_REQUIRED = true`.

## 2026-05-29 — Mobile/standalone: fix overflow e scroll, meta PWA

- `index.html`: viewport `viewport-fit=cover`, `theme-color` (light/dark), meta
  Apple/Android per la modalità **standalone** (app aggiunta alla Home), titolo
  "MyHub", link al manifest.
- Nuovo `public/manifest.webmanifest` (display standalone, colori slate, icona).
- `index.css`: `overflow-x: hidden` + `overscroll-behavior-y: none` (niente scroll
  orizzontale né rimbalzo), `min-height: 100dvh`.
- PayStats: **safe-area** gestite — header mobile sotto il notch
  (`env(safe-area-inset-top)`), bottom nav e padding contenuto sopra l'home
  indicator (`env(safe-area-inset-bottom)`); pulsante "Hub" rialzato di conseguenza.
- Selettore mese reso non-overflowante su schermi stretti (label troncata,
  gruppi `shrink-0`).

## 2026-05-29 — PayStats: 4ª voce (Account) nella bottom bar mobile

- La barra di navigazione mobile passa a **4 voci con il + centrato**:
  Dashboard · Spese · [＋ FAB] · Categorie · **Account**.
- Nuova voce **Account** (icona utente) che naviga a `/account` dell'hub
  (via `useNavigate`). Il pulsante "+" è ora esattamente al centro (3° di 5 slot).

## 2026-05-29 — Fix schermo bianco PayStats (recharts 2 + Vite 5)

Diagnosticata la causa dello schermo bianco di PayStats in **dev**: recharts 3
dipende da `es-toolkit`, il cui pre-bundling rompe l'optimizer di Vite
(`TypeError: require_isUnsafeProperty is not a function`) — il build di produzione
(Rollup) invece funzionava, da qui la difficoltà a notarlo.

- **recharts** riportato a **2.15.x** (usa lodash, nessun es-toolkit): elimina
  l'errore dell'optimizer. API dei grafici invariata (nessuna modifica al codice).
- **vite** riportato alla **5.4.x** stabile (+ `@vitejs/plugin-react` 4.x) al posto
  della 8/Rolldown sperimentale (che dava lo stesso problema ed era già stata
  motivo di downgrade nel repo originale).
- Doc allineati (README/architecture/deployment: Vite 5, recharts 2).

> Se vedi ancora il vecchio comportamento in dev: ferma il server, elimina
> `node_modules/.vite`, riavvia `npm run dev` e fai hard refresh (Ctrl+Shift+R).

## 2026-05-29 — PayStats: tema slate, emoji picker, dashboard personalizzabile

### Nuovo tema scuro (slate + indigo)
- Palette `surface` in `tailwind.config.js` ridisegnata su scala **slate**: sfondo
  `#0f172a`, card `#1e293b`, bordi `#334155` (accento indigo invariato).
- `.card` in `index.css` portata a `surface-900` (card) con bordo `surface-800`.
- NB: una modifica a `tailwind.config.js` richiede il **riavvio del dev server**
  (l'HMR non riprocessa il config).

### Emoji picker per le categorie
- Nuovo `components/EmojiPicker.tsx`: pulsantino con l'emoji corrente che apre una
  griglia di emoji raggruppate + campo per incollarne una qualsiasi.
- `ManageCategoriesModal` usa il picker al posto della griglia fissa di icone.

### Dashboard personalizzabile
- Nuovo `dashboard.ts` (registro widget, layout di default, load/save su
  localStorage — preferenza per-dispositivo) e `components/CustomizeDashboardModal.tsx`
  (mostra/nascondi + riordina con frecce su/giù, ripristino predefinito).
- `App.tsx`: i riquadri (Insights, Distribuzione, Budget, Andamento, Confronto,
  Calendario, Ultime transazioni) ora sono renderizzati dinamicamente dall'ordine/
  visibilità scelti; pulsante "Personalizza" accanto al selettore mese.

## 2026-05-29 — PayStats: error boundary

- Aggiunto `src/apps/paystats/ErrorBoundary.tsx` attorno a PayStats: in caso di
  errore di render mostra un messaggio leggibile (con dettaglio tecnico) invece di
  uno schermo bianco, con azioni "Riprova" e "Reset dati locali" (pulisce le chiavi
  `paystats_*`). Logga l'errore in console per il debug.

## 2026-05-29 — Flag di bypass login (sviluppo)

- Nuova env `VITE_AUTH_BYPASS`: se `true`, `RequireAccess` lascia entrare nelle app
  senza login né abbonamento anche con Supabase configurato (comodo per non fare
  login a ogni avvio in sviluppo). Esportata come `authBypass` in
  `src/lib/supabase.ts`; documentata in `.env.example`, `vite-env.d.ts`,
  `data-model.md`, `architecture.md`. Da tenere disattivata in produzione.

## 2026-05-29 — PayStats: navigazione mesi + valuta configurabile

### Navigazione tra mesi
- La dashboard ora ha un **selettore mese** (‹ mese › + "Oggi") che fa da mese di
  riferimento. Statistiche e **tutti i grafici** (Donut, Trend, CategoryBar,
  BudgetProgress, CalendarHeatmap, Insights) sono stati refattorizzati per
  accettare `year`/`month` invece di ancorarsi a `new Date()`.
- La proiezione di fine mese si applica solo al mese corrente; nei mesi chiusi le
  card mostrano l'effettivo (es. "Risparmio" invece di "Risparmio previsto").

### Valuta configurabile
- Nuovo `src/apps/paystats/format.ts` (formatter centralizzato `formatMoney` +
  `currencySymbol`, valute EUR/USD/GBP/CHF/JPY).
- Impostazione **valuta** in `SettingsMenu`; persistita per-utente
  (`paystats_settings.currency` + `setCurrencyRemote`) o in localStorage (demo).
- Sostituito il simbolo `€` hardcoded in tutti i componenti (app, lista, modale,
  tooltip e assi dei grafici) con il formatter basato sulla valuta scelta.

## 2026-05-29 — PayStats: fondamenta (modifica spesa + onboarding)

- **Modifica spesa**: nuovo `updateExpense` in `useExpenses` (locale + remoto via
  upsert); `AddExpenseModal` ora è dual-mode (aggiungi/modifica); pulsante matita
  in `ExpenseList`; wiring in `App.tsx` (stato `editing`).
- **Empty state / onboarding**: la dashboard mostra una schermata di benvenuto per
  gli account senza spese (CTA "aggiungi prima spesa" e "gestisci categorie") e un
  loader durante il caricamento remoto (`loading` esposto dall'hook). Risolve la
  dashboard vuota introdotta dal passaggio ai dati per-utente.

## 2026-05-29 — Dati PayStats per-utente su Supabase

### Backend (schema)
- Nuove tabelle `paystats_categories`, `paystats_expenses`, `paystats_settings`
  (PK su `user_id`), con RLS che isola i dati per utente (`auth.uid() = user_id`).

### Frontend
- Nuovo `src/apps/paystats/remote.ts`: `loadAll(userId)` (con seeding delle
  categorie di default al primo accesso, niente spese demo su account reale) e
  mutazioni granulari (`upsert/delete` categorie e spese, `setIncome`).
- `useExpenses` rifattorizzato: con Supabase + utente loggato usa il backend remoto
  (sync multi-dispositivo); altrimenti `localStorage` (demo). Aggiornamento
  ottimistico dello stato + persistenza sul backend attivo. Esposto anche `loading`.
- `DEFAULT_CATEGORIES` esportato da `storage.ts` per il seeding remoto.

### Documentazione
- `data-model.md` (sezione dati app figlie: account vs demo), `architecture.md`
  (flusso dati, app figlie con auth condivisa, debito tecnico).

## 2026-05-29 — Ruolo admin e scrittura del catalogo su Supabase

### Backend (schema)
- `profiles.is_admin` (boolean, default false) + `alter table … add column if not
  exists` per i DB esistenti.
- Funzione `public.is_admin()` (SECURITY DEFINER) e policy RLS di **scrittura** su
  `apps` (insert/update/delete riservati agli admin). Lettura resta pubblica.
- Nota di bootstrap del primo admin in `schema.sql`.

### Frontend
- `AuthContext`: carica `is_admin` ed espone `isAdmin`.
- `storage.ts`: `upsertAppRemote`, `deleteAppRemote`, `saveOrderRemote`,
  `isRemoteCatalog` per il CRUD del catalogo su Supabase.
- `AdminPage`: con Supabase l'accesso è riservato all'admin loggato (redirect a
  `/login` se anonimo, schermata "Accesso riservato" se non admin) e ogni
  add/edit/delete/riordino scrive su Supabase con cache locale e banner d'errore;
  pulsante "Esci". In modalità demo resta il PIN + localStorage (sezione PIN
  nascosta quando Supabase è attivo).

### Documentazione
- Aggiornati `data-model.md` (is_admin, policy, bootstrap admin, origine catalogo),
  `architecture.md` (accesso `/admin`, debito tecnico), `deployment.md` (step
  nomina admin), `adding-apps.md`.

## 2026-05-29 — Preparazione al deploy

- `package.json`: aggiunto `engines.node` = `22.x` (Vercel rispetta la versione;
  Node 22 è necessario per buildare con Vite 8).
- Nuovo `.nvmrc` (`22`) per allineare l'ambiente locale.
- `deployment.md`: aggiunto **Step 0** (preparazione del repository git, prima
  assente), nota sulla versione di Node e sezione sulle Serverless Functions
  (`api/` auto-rilevata, helper `_lib`, dipendenze runtime, rewrite).

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
