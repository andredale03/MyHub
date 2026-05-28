# MyHub — Documentazione

MyHub è una **piattaforma** che ospita più mini-app dentro un'unica shell, con
login condiviso e accesso tramite un abbonamento unico "tutto incluso" (stile Setapp).

Indice della documentazione del progetto.

| File | Contenuto |
|------|-----------|
| [architecture.md](architecture.md) | Monorepo, shell, routing, auth, scelte tecniche |
| [data-model.md](data-model.md) | Schema Supabase, entitlement, env, persistenza app figlie |
| [adding-apps.md](adding-apps.md) | Come aggiungere un'app (interna o esterna) |
| [design-system.md](design-system.md) | Colori, icone, gradienti e classi condivise |
| [deployment.md](deployment.md) | Deploy su Vercel + configurazione Supabase |
| [CHANGELOG.md](CHANGELOG.md) | Log delle modifiche nel tempo |

## Avvio rapido

```bash
npm install
cp .env.example .env     # opzionale: compila per attivare login/abbonamento
npm run dev              # http://localhost:5174
npm run build            # genera dist/
```

Senza `.env` l'hub gira in **modalità demo** (nessun login, tutte le app accessibili).
Per attivare auth e abbonamento vedi [data-model.md](data-model.md) e [deployment.md](deployment.md).

## App incluse

| App | Route | Stato |
|-----|-------|-------|
| PayStats | `/app/paystats` | Live (modulo interno) |
