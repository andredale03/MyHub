import type { Category, Expense } from './types'

const KEYS = {
  categories: 'paystats_categories',
  expenses:   'paystats_expenses',
  income:     'paystats_income',
  seeded:     'paystats_seeded',
}

const DEFAULT_INCOME = 2500

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food',          name: 'Cibo & Ristoranti', color: '#f97316', icon: '🍔', budget: 400 },
  { id: 'transport',     name: 'Trasporti',          color: '#3b82f6', icon: '🚗', budget: 150 },
  { id: 'entertainment', name: 'Svago',              color: '#a855f7', icon: '🎬', budget: 200 },
  { id: 'health',        name: 'Salute',             color: '#22c55e', icon: '💊', budget: 100 },
  { id: 'shopping',      name: 'Shopping',           color: '#ec4899', icon: '🛍️', budget: 300 },
  { id: 'home',          name: 'Casa',               color: '#14b8a6', icon: '🏠', budget: 900 },
]

const KNOWN_BUDGETS: Record<string, number> = {
  food: 400, transport: 150, entertainment: 200, health: 100, shopping: 300, home: 900,
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// ── seed data generator ──────────────────────────────────────────────────────

let _seedCounter = 0
function sid(): string { return `s${_seedCounter++}` }

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function generateSeedExpenses(): Expense[] {
  const now = new Date()

  const raw: Array<{
    catId: string; amt: number; desc: string; mo: number; day: number
  }> = [
    // ── current month ────────────────────────────────────────────────────────
    { catId: 'home',          amt: 850,   desc: 'Affitto',              mo: 0,  day: 1  },
    { catId: 'food',          amt: 12.50, desc: 'Colazione al bar',     mo: 0,  day: 1  },
    { catId: 'food',          amt: 67.30, desc: 'Supermercato',         mo: 0,  day: 2  },
    { catId: 'transport',     amt: 35.00, desc: 'Abbonamento bus',      mo: 0,  day: 3  },
    { catId: 'food',          amt: 18.90, desc: 'Pranzo al ristorante', mo: 0,  day: 4  },
    { catId: 'entertainment', amt: 15.99, desc: 'Netflix',              mo: 0,  day: 5  },
    { catId: 'food',          amt: 8.50,  desc: 'Bar',                  mo: 0,  day: 6  },
    { catId: 'shopping',      amt: 89.90, desc: 'T-shirt e jeans',      mo: 0,  day: 7  },
    { catId: 'food',          amt: 54.20, desc: 'Spesa settimanale',    mo: 0,  day: 8  },
    { catId: 'health',        amt: 25.00, desc: 'Farmacia',             mo: 0,  day: 9  },
    { catId: 'food',          amt: 22.50, desc: 'Cena fuori',           mo: 0,  day: 10 },
    { catId: 'transport',     amt: 28.00, desc: 'Benzina',              mo: 0,  day: 11 },
    { catId: 'entertainment', amt: 32.00, desc: 'Cinema e aperitivo',   mo: 0,  day: 12 },
    { catId: 'food',          amt: 48.60, desc: 'Supermercato',         mo: 0,  day: 13 },
    { catId: 'shopping',      amt: 45.00, desc: 'Scarpe',               mo: 0,  day: 14 },
    { catId: 'food',          amt: 15.80, desc: 'Pranzo veloce',        mo: 0,  day: 15 },
    { catId: 'health',        amt: 18.50, desc: 'Integratori',          mo: 0,  day: 16 },
    { catId: 'food',          amt: 61.40, desc: 'Supermercato',         mo: 0,  day: 17 },
    { catId: 'entertainment', amt: 22.00, desc: 'Aperitivo',            mo: 0,  day: 18 },
    { catId: 'transport',     amt: 12.00, desc: 'Parcheggio',           mo: 0,  day: 19 },
    { catId: 'food',          amt: 9.80,  desc: 'Bar',                  mo: 0,  day: 20 },
    { catId: 'shopping',      amt: 35.00, desc: 'Libro e riviste',      mo: 0,  day: 21 },
    { catId: 'food',          amt: 44.20, desc: 'Spesa',                mo: 0,  day: 22 },

    // ── last month ───────────────────────────────────────────────────────────
    { catId: 'home',          amt: 850,   desc: 'Affitto',              mo: -1, day: 1  },
    { catId: 'food',          amt: 71.40, desc: 'Supermercato',         mo: -1, day: 2  },
    { catId: 'transport',     amt: 35.00, desc: 'Abbonamento bus',      mo: -1, day: 3  },
    { catId: 'food',          amt: 14.80, desc: 'Pranzo',               mo: -1, day: 5  },
    { catId: 'entertainment', amt: 15.99, desc: 'Netflix',              mo: -1, day: 5  },
    { catId: 'food',          amt: 9.20,  desc: 'Colazione',            mo: -1, day: 7  },
    { catId: 'health',        amt: 45.00, desc: 'Visita medica',        mo: -1, day: 8  },
    { catId: 'food',          amt: 58.30, desc: 'Spesa settimana',      mo: -1, day: 9  },
    { catId: 'shopping',      amt: 120.00,desc: 'Abbigliamento',        mo: -1, day: 11 },
    { catId: 'food',          amt: 28.50, desc: 'Cena sushi',           mo: -1, day: 13 },
    { catId: 'entertainment', amt: 45.00, desc: 'Concerto',             mo: -1, day: 15 },
    { catId: 'transport',     amt: 42.00, desc: 'Benzina',              mo: -1, day: 16 },
    { catId: 'food',          amt: 63.20, desc: 'Supermercato',         mo: -1, day: 16 },
    { catId: 'home',          amt: 65.00, desc: 'Bolletta luce',        mo: -1, day: 18 },
    { catId: 'food',          amt: 18.90, desc: 'Pranzo',               mo: -1, day: 19 },
    { catId: 'shopping',      amt: 199.00,desc: 'Cuffie Bluetooth',     mo: -1, day: 21 },
    { catId: 'food',          amt: 55.80, desc: 'Spesa',                mo: -1, day: 23 },
    { catId: 'entertainment', amt: 25.00, desc: 'Aperitivo con amici',  mo: -1, day: 25 },
    { catId: 'food',          amt: 11.50, desc: 'Colazione',            mo: -1, day: 26 },
    { catId: 'transport',     amt: 18.00, desc: 'Taxi',                 mo: -1, day: 27 },
    { catId: 'food',          amt: 38.90, desc: 'Cena pizza',           mo: -1, day: 28 },
    { catId: 'health',        amt: 30.00, desc: 'Farmacia',             mo: -1, day: 29 },

    // ── two months ago ───────────────────────────────────────────────────────
    { catId: 'home',          amt: 850,   desc: 'Affitto',              mo: -2, day: 1  },
    { catId: 'food',          amt: 68.50, desc: 'Supermercato',         mo: -2, day: 2  },
    { catId: 'transport',     amt: 35.00, desc: 'Abbonamento bus',      mo: -2, day: 3  },
    { catId: 'entertainment', amt: 15.99, desc: 'Netflix',              mo: -2, day: 5  },
    { catId: 'food',          amt: 22.30, desc: 'Pranzo fuori',         mo: -2, day: 6  },
    { catId: 'food',          amt: 10.50, desc: 'Bar',                  mo: -2, day: 7  },
    { catId: 'shopping',      amt: 75.00, desc: 'Vestiti',              mo: -2, day: 10 },
    { catId: 'food',          amt: 61.40, desc: 'Supermercato',         mo: -2, day: 12 },
    { catId: 'health',        amt: 55.00, desc: 'Dentista',             mo: -2, day: 14 },
    { catId: 'entertainment', amt: 38.00, desc: 'Teatro',               mo: -2, day: 15 },
    { catId: 'transport',     amt: 38.00, desc: 'Benzina',              mo: -2, day: 15 },
    { catId: 'food',          amt: 16.80, desc: 'Pranzo',               mo: -2, day: 17 },
    { catId: 'home',          amt: 58.00, desc: 'Bolletta gas',         mo: -2, day: 18 },
    { catId: 'food',          amt: 52.90, desc: 'Spesa',                mo: -2, day: 19 },
    { catId: 'shopping',      amt: 145.00,desc: 'Scarpe da ginnastica', mo: -2, day: 20 },
    { catId: 'food',          amt: 31.50, desc: 'Cena',                 mo: -2, day: 22 },
    { catId: 'entertainment', amt: 20.00, desc: 'Aperitivo',            mo: -2, day: 24 },
    { catId: 'food',          amt: 48.20, desc: 'Supermercato',         mo: -2, day: 25 },
    { catId: 'transport',     amt: 25.00, desc: 'Taxi',                 mo: -2, day: 26 },
    { catId: 'food',          amt: 14.90, desc: 'Colazione',            mo: -2, day: 28 },
    { catId: 'shopping',      amt: 65.00, desc: 'Libri',                mo: -2, day: 29 },
    { catId: 'food',          amt: 42.30, desc: 'Supermercato',         mo: -2, day: 30 },
  ]

  const result: Expense[] = []
  for (const e of raw) {
    const targetMonth = now.getMonth() + e.mo
    const date = new Date(now.getFullYear(), targetMonth, e.day)
    // Reject overflowed days (e.g. Apr 31 → May 1)
    const intendedMon = ((targetMonth % 12) + 12) % 12
    if (date.getMonth() !== intendedMon) continue
    // Reject future dates
    if (date > now) continue
    const ds = dateStr(date.getFullYear(), date.getMonth(), date.getDate())
    result.push({
      id: sid(),
      amount: e.amt,
      description: e.desc,
      categoryId: e.catId,
      date: ds,
      createdAt: ds + 'T12:00:00.000Z',
    })
  }
  return result
}

// ── public API ───────────────────────────────────────────────────────────────

export const storage = {
  getCategories(): Category[] {
    const cats = read<Category[]>(KEYS.categories, [])
    if (cats.length === 0) {
      write(KEYS.categories, DEFAULT_CATEGORIES)
      return DEFAULT_CATEGORIES
    }
    // Migrate: add budget to default categories that are missing it
    const migrated = cats.map(c =>
      c.budget !== undefined ? c : { ...c, budget: KNOWN_BUDGETS[c.id] }
    )
    if (migrated.some((c, i) => c.budget !== cats[i].budget)) {
      write(KEYS.categories, migrated)
    }
    return migrated
  },

  saveCategories(cats: Category[]): void {
    write(KEYS.categories, cats)
  },

  getExpenses(): Expense[] {
    // Seed rich demo data once (if never seeded before)
    if (!localStorage.getItem(KEYS.seeded)) {
      const seed = generateSeedExpenses()
      write(KEYS.expenses, seed)
      localStorage.setItem(KEYS.seeded, '1')
      return seed
    }
    return read<Expense[]>(KEYS.expenses, [])
  },

  saveExpenses(expenses: Expense[]): void {
    write(KEYS.expenses, expenses)
  },

  getIncome(): number {
    return read<number>(KEYS.income, DEFAULT_INCOME)
  },

  setIncome(income: number): void {
    write(KEYS.income, income)
  },

  resetToDemo(): void {
    localStorage.removeItem(KEYS.seeded)
    localStorage.removeItem(KEYS.expenses)
  },
}
