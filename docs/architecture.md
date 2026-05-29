# Architettura del progetto

MyHub è una **piattaforma monorepo**: un'unica app React (la *shell*) che ospita
più mini-app come moduli interni. Le app non sono più siti separati aperti in un
nuovo tab, ma route montate dentro la shell, con login e accesso condivisi.

Modello di prodotto: **abbonamento unico "tutto incluso"** (stile Setapp). Un
abbonamento attivo sblocca tutte le app del catalogo. Qualità curata, non quantità.

## Struttura delle cartelle

```
MyHub/
├── docs/                       # Documentazione del progetto
│   ├── README.md
│   ├── adding-apps.md
│   ├── architecture.md         # questo file
│   ├── data-model.md           # schema Supabase + entitlement
│   ├── design-system.md
│   ├── deployment.md
│   └── CHANGELOG.md
├── supabase/
│   └── schema.sql              # schema DB da eseguire su Supabase
├── api/                        # Vercel Serverless Functions (lato server)
│   ├── _lib/
│   │   ├── stripe.ts           # client Stripe (null se non configurato)
│   │   └── supabaseAdmin.ts    # client service-role + getUserFromToken()
│   ├── create-checkout-session.ts  # apre la Checkout Session Stripe
│   └── stripe-webhook.ts       # mirrora lo stato abbonamento su Supabase
├── vercel.json                 # rewrite SPA che escludono /api
├── src/
│   ├── main.tsx                # entry point: Router + AuthProvider + route
│   ├── App.tsx                 # Home dell'hub (catalogo app)
│   ├── AdminPage.tsx           # Area admin (PIN + CRUD catalogo app)
│   ├── AppFrame.tsx            # Cornice attorno alle app montate (back all'hub)
│   ├── storage.ts              # Layer localStorage del catalogo (AppEntry)
│   ├── lib/
│   │   └── supabase.ts         # Client Supabase (null se non configurato)
│   ├── auth/
│   │   ├── AuthContext.tsx     # Sessione, profilo, abbonamento, hasAccess()
│   │   ├── RequireAccess.tsx   # Guardia di route (login + entitlement)
│   │   ├── LoginPage.tsx       # /login — accesso e registrazione
│   │   └── AccountPage.tsx     # /account — stato abbonamento, logout
│   ├── apps/                   # ⬅ mini-app montate nella shell
│   │   └── paystats/           # PayStats come modulo interno
│   │       ├── index.tsx       # wrapper di montaggio (ToastProvider + App)
│   │       ├── App.tsx
│   │       ├── storage.ts      # persistenza propria (localStorage, namespace paystats_)
│   │       ├── types.ts
│   │       ├── components/  hooks/  context/
│   └── index.css               # Tailwind + classi componente condivise
├── index.html
├── vite.config.ts
├── tailwind.config.js          # palette brand + surface, shadow, radius
└── package.json
```

## Stack tecnico

| Tecnologia | Ruolo |
|------------|-------|
| React 19 + TypeScript | UI framework + type safety |
| Vite 5 | Build tool e dev server (stabile; v8/Rolldown rompe recharts in dev) |
| Tailwind CSS 3 | Styling utility-first (palette `brand` + `surface`) |
| React Router DOM 7 | Routing tra hub, admin, auth e app figlie |
| @supabase/supabase-js | Auth + database (profili, abbonamento, catalogo) |
| Recharts | Grafici (usato da PayStats) |
| lucide-react | Icone UI |

## Routing

| Route | Componente | Accesso |
|-------|-----------|---------|
| `/` | `App.tsx` | Pubblico (catalogo) |
| `/admin` | `AdminPage.tsx` | Admin Supabase (`is_admin`); PIN in modalità demo |
| `/login` | `LoginPage.tsx` | Pubblico |
| `/account` | `AccountPage.tsx` | Richiede login |
| `/app/paystats` | `apps/paystats` | Richiede login + abbonamento attivo |

Le app figlie sono caricate in **lazy** (`React.lazy`): il loro bundle (es. Recharts
per PayStats) non pesa sul caricamento iniziale dell'hub.

## Autenticazione ed entitlement

Gestiti da `AuthProvider` (`src/auth/AuthContext.tsx`), che espone sessione,
profilo, stato abbonamento, `isAdmin` e la funzione `hasAccess(appId)`.

```
main.tsx
 └─ <AuthProvider>            ← sessione Supabase + profilo + abbonamento
      └─ <Routes>
           └─ /app/paystats
                └─ <RequireAccess appId="paystats">   ← guardia
                     └─ <AppFrame> <PayStats/> </AppFrame>
```

`RequireAccess` decide:
- **modalità demo** (Supabase non configurato) → accesso libero;
- **`VITE_AUTH_BYPASS=true`** (solo sviluppo) → accesso libero anche con Supabase
  configurato, senza login né abbonamento;
- non autenticato → redirect a `/login`;
- autenticato senza abbonamento attivo → redirect a `/account`;
- altrimenti → mostra l'app.

**Modalità demo**: se mancano le env `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`,
l'hub funziona senza login e con tutte le app accessibili. Utile in sviluppo prima
di configurare Supabase. Vedi [data-model.md](data-model.md) e [deployment.md](deployment.md).

## Pagamenti (Stripe)

L'abbonamento è gestito con **Stripe Checkout** (pagina ospitata) e un **webhook**
che sincronizza lo stato su Supabase. La logica vive nelle Serverless Functions in
`api/` (mai nel browser): solo il `service_role` e le chiavi Stripe possono
scrivere su `profiles`.

```
Attivazione abbonamento:
  AccountPage → startCheckout() (src/lib/billing.ts)
    → POST /api/create-checkout-session  (Bearer = token Supabase)
      → crea/riusa customer Stripe (profiles.stripe_customer_id)
      → Checkout Session → redirect a Stripe
  utente paga → redirect a /account?checkout=success

Sincronizzazione stato (asincrona):
  Stripe → POST /api/stripe-webhook (firma verificata sul raw body)
    → updateByCustomer() aggiorna profiles.subscription_status
      + subscription_current_period_end
  AccountPage al ritorno chiama refreshProfile() (ritentato, il webhook è async)
```

Eventi gestiti: `checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`. Vedi [deployment.md](deployment.md) per il setup.

## Scelte architetturali

**Monorepo a singola app** — invece di micro-frontend o tab esterni, ogni mini-app
è una cartella sotto `src/apps/` montata come route. Dà la sensazione di "ambiente
unico" (login, tema e navigazione condivisi) con la minima complessità.

**App figlie autosufficienti (con auth condivisa)** — ogni app sotto `src/apps/`
conserva i propri componenti, hook, contesti e layer di persistenza. PayStats
persiste su Supabase per-utente quando l'utente è loggato (`remote.ts`) e ricade su
`localStorage` (namespace `paystats_`) in modalità demo. Per la sync per-utente
l'hook `useExpenses` usa l'auth dell'hub (`useAuth`): è l'unico punto di
accoppiamento con la shell.

**`hasAccess` centralizzato** — la logica "chi può aprire cosa" vive in un solo punto
(`AuthContext`). Oggi implementa il modello "tutto incluso"; domani può diventare
granulare (tabella `entitlements`) senza toccare le guardie di route.

**Catalogo: Supabase con fallback locale** — la home legge il catalogo via
`fetchApps()` (`storage.ts`): se Supabase è configurato interroga la tabella `apps`
(lettura pubblica) e ne fa cache in localStorage; in modalità demo o in caso di
errore ricade su `loadApps()` (localStorage / `DEFAULT_APPS`). La UI mostra subito
la cache locale e poi sostituisce con i dati remoti.

**Tema unificato** — un'unica chiave `hub-theme` è la sorgente di verità del tema,
condivisa tra hub e app figlie (`src/lib/theme.ts`). PayStats legge/scrive la
stessa chiave (migrando dalla storica `paystats_theme`), così il tema resta
sincronizzato passando tra hub e app.

**Client Supabase opzionale** — `lib/supabase.ts` espone `null` quando le env non
sono presenti, così l'app builda e gira anche senza backend.

## Flusso dati

```
Auth/abbonamento:
  Supabase (auth.users + profiles) → AuthContext → RequireAccess → app figlie

Catalogo app:
  Supabase (tabella apps) → fetchApps() → App.tsx (catalogo)
  fallback: localStorage (hub-apps) → loadApps() ; AdminPage (CRUD) usa localStorage

Dati delle app figlie:
  PayStats con utente loggato → Supabase per-utente (paystats_* tables) via remote.ts
  fallback demo → localStorage namespaced (paystats_*) → hook useExpenses
```

## Chiavi localStorage

| Chiave | Contenuto |
|--------|-----------|
| `hub-apps` | JSON array di `AppEntry[]` (catalogo / cache di `fetchApps`) |
| `hub-pin` | PIN admin (default `1234`) |
| `hub-theme` | `'light'` \| `'dark'` — **tema condiviso** hub + app figlie |
| `paystats_*` | dati interni di PayStats (categorie, spese, reddito) |

> `paystats_theme` resta allineata a `hub-theme` solo per compatibilità storica;
> la sorgente di verità è `hub-theme`.

## Debito tecnico noto

- **PIN admin solo in demo**: senza Supabase l'area `/admin` è protetta da un PIN
  client-side (uso personale). Con Supabase l'accesso passa invece dal ruolo
  `is_admin` con policy RLS lato DB.
- **Mutazioni PayStats fire-and-forget**: le scritture remote non bloccano la UI e
  non mostrano ancora un errore in caso di fallimento (aggiornamento ottimistico).
  Da rivedere se serve feedback esplicito o riconciliazione.
