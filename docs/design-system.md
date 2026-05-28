# Design system

> La shell dell'hub usa la palette `brand` (indigo) + `zinc`. Le **app figlie**
> (es. PayStats) usano in più la palette `surface`, le ombre `card`/`card-lg`, il
> raggio `xl2` e le classi componente condivise (`.card`, `.btn-*`, `.chip`,
> `.input`, `.label`, `.badge`) definite in `src/index.css` e `tailwind.config.js`.
> Queste sono state unificate nel monorepo per far rendere le app figlie
> correttamente dentro la shell.

## Palette colori

Il hub usa Tailwind CSS con il tema `brand` (indigo) e `zinc` per le superfici.

### Colori brand (indigo)

| Token | Hex | Uso |
|-------|-----|-----|
| `brand-50` | #eef2ff | Background hover leggero |
| `brand-300` | #a5b4fc | Border hover card (light) |
| `brand-400` | #818cf8 | Testo link dark mode |
| `brand-600` | #4f46e5 | Icona hub, testo link light |
| `brand-700` | #4338ca | Border hover card (dark) |

### Superfici (zinc)

| Token | Uso |
|-------|-----|
| `zinc-50` | Background pagina (light) |
| `zinc-100` | Hover button (light) |
| `zinc-200` | Border card, border header |
| `zinc-400` | Testo secondario |
| `zinc-500` | Testo descrizione |
| `zinc-800` | Border card, hover button (dark) |
| `zinc-900` | Background card, header (dark) |
| `zinc-950` | Background pagina (dark) |

## Gradienti disponibili per le card

Ogni app ha un gradiente nella banda superiore della card. Usa coppie di colori armonici.

```
from-indigo-500 to-purple-600    → viola/indaco  (PayStats)
from-teal-500 to-cyan-600        → teal/azzurro
from-emerald-500 to-green-600    → verde
from-orange-500 to-amber-600     → arancione
from-rose-500 to-pink-600        → rosa/rosso
from-blue-500 to-indigo-600      → blu
from-violet-500 to-purple-600    → viola
from-sky-500 to-blue-600         → celeste
from-lime-500 to-emerald-600     → lime/verde
from-red-500 to-rose-600         → rosso
```

## Icone

Le icone delle card sono **emoji** — semplici, universali, nessuna dipendenza.

Suggerimenti per app comuni:

| App | Emoji |
|-----|-------|
| Finance / spese | 💰 |
| Calendario / agenda | 🗓️ |
| Salute / fitness | 🏃 |
| Note / scrittura | 📝 |
| Musica | 🎵 |
| Viaggi | ✈️ |
| Cucina / ricette | 🍳 |
| Lavoro / task | ✅ |
| Meteo | 🌤️ |
| Libreria / lettura | 📚 |

Le icone dell'interfaccia (navbar, toggle tema) usano **lucide-react**.

## Tipografia

Font: **Inter** (Google Fonts)

| Elemento | Classi Tailwind |
|----------|----------------|
| Titolo hub | `text-4xl sm:text-5xl font-bold tracking-tight` |
| Nome app (card) | `text-base font-semibold` |
| Descrizione (card) | `text-sm` |
| Badge status | `text-xs font-medium` |
| Link "Apri app" | `text-sm font-medium` |

## Struttura di una card

```
┌─────────────────────────────┐
│ ████ gradiente 8px ████████ │  ← h-2, bg-gradient-to-r
├─────────────────────────────┤
│ 🗓️                    Live  │  ← emoji + badge status
│                             │
│ Nome App                    │  ← font-semibold
│ Descrizione breve che spiega│  ← text-sm, text-zinc-500
│ cosa fa questa app.         │
│                             │
│ Apri app ↗                  │  ← solo se status === 'live'
└─────────────────────────────┘
```
