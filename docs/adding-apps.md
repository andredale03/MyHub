# Aggiungere una nuova app

Ci sono due tipi di app nell'hub:

- **App interne** (consigliato): montate dentro la shell come route `/app/<slug>`.
  L'utente non lascia mai l'hub. È il modello con cui è integrato PayStats.
- **App esterne**: un semplice link che apre un sito in un nuovo tab (campo `url`).

## A. Aggiungere un'app interna (modulo)

### 1. Crea il modulo

Aggiungi una cartella sotto `src/apps/<slug>/` con almeno un `index.tsx` che
esporta di default il componente radice dell'app:

```tsx
// src/apps/myapp/index.tsx
export default function MyApp() {
  return <div>…</div>
}
```

Se l'app ha bisogno di provider propri (toast, context, ecc.), incapsulali qui —
così resta autosufficiente. Esempio reale: `src/apps/paystats/index.tsx` avvolge
l'app nel suo `ToastProvider`.

### 2. Registra la route nella shell

In `src/main.tsx` aggiungi la route, in lazy, protetta da `RequireAccess`:

```tsx
const MyApp = lazy(() => import('./apps/myapp'))

<Route
  path="/app/myapp"
  element={
    <RequireAccess appId="myapp">
      <AppFrame>
        <Suspense fallback={<AppFallback />}>
          <MyApp />
        </Suspense>
      </AppFrame>
    </RequireAccess>
  }
/>
```

`AppFrame` aggiunge il pulsante flottante "← Hub". `RequireAccess` gestisce login
e abbonamento.

### 3. Aggiungi la card al catalogo

Tre modi (in ordine di praticità):

- **Admin** (`/admin`, PIN default `1234`): "Nuova app" → scegli **Tipo: Interna**
  e compila il campo **Route** (es. `/app/myapp`). Il form normalizza i dati
  (un'app interna non ha `url`).
- **Supabase** (se il catalogo è servito dal DB): inserisci una riga nella tabella
  `apps` con `route` valorizzato. Vedi sotto "Catalogo da Supabase".
- **Codice**: aggiungi una voce a `DEFAULT_APPS` in `src/storage.ts`:

```ts
{
  id: 'myapp',
  name: 'My App',
  description: '…',
  url: '',
  route: '/app/myapp',
  icon: '🚀',
  color: 'from-teal-500 to-cyan-600',
  status: 'live',
  order: 1,
}
```

### 4. Catalogo da Supabase

Quando Supabase è configurato, l'hub legge il catalogo dalla tabella `apps`
(`fetchApps()` in `src/storage.ts`), con fallback automatico a localStorage in
caso di errore o modalità demo. Per aggiungere un'app interna, inserisci una riga
con `route` valorizzato e `url` lasciato a `null`; lo schema di riferimento è in
[`supabase/schema.sql`](../supabase/schema.sql) (colonna `sort_order` per
l'ordine).

## B. Aggiungere un'app esterna (link)

Più semplice: dall'admin (`/admin`, PIN default `1234`) crea una nuova app,
scegli **Tipo: Esterna** e compila `url` con il dominio esterno. La card aprirà
l'URL in un nuovo tab.

## Stati dell'app (`status`)

| Valore | Etichetta | Comportamento |
|--------|-----------|---------------|
| `live` | Live | Card attiva (apre route o url) |
| `wip` | In corso | Card non cliccabile, opacità ridotta |
| `planned` | Pianificata | Card non cliccabile, opacità ridotta |

## Campi di `AppEntry`

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | string | Identificatore unico |
| `name` | string | Nome nella card |
| `description` | string | Testo descrittivo |
| `url` | string | URL esterno (usato solo se `route` è assente) |
| `route` | string? | Route interna alla shell (es. `/app/paystats`) |
| `icon` | string | Emoji |
| `color` | string | Gradiente Tailwind (vedi [design-system.md](design-system.md)) |
| `status` | enum | `live` \| `wip` \| `planned` |
| `order` | number | Posizione nella griglia |
