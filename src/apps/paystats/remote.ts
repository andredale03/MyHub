import { supabase } from '../../lib/supabase'
import type { Category, Expense } from './types'
import { DEFAULT_CATEGORIES } from './storage'

const DEFAULT_INCOME = 2500

/** PayStats usa Supabase per i dati solo se il client è configurato. */
export const isRemotePaystats = Boolean(supabase)

// ── mapping righe DB ⇄ tipi app ──────────────────────────────────────────────

interface CategoryRow {
  id: string
  name: string
  color: string | null
  icon: string | null
  budget: number | null
}

interface ExpenseRow {
  id: string
  amount: number
  description: string | null
  category_id: string | null
  date: string
  created_at: string
}

function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    color: r.color ?? '#6366f1',
    icon: r.icon ?? '💸',
    budget: r.budget ?? undefined,
  }
}

function categoryToRow(userId: string, c: Category) {
  return {
    user_id: userId,
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon,
    budget: c.budget ?? null,
  }
}

function rowToExpense(r: ExpenseRow): Expense {
  return {
    id: r.id,
    amount: Number(r.amount),
    description: r.description ?? '',
    categoryId: r.category_id ?? '',
    date: r.date,
    createdAt: r.created_at,
  }
}

function expenseToRow(userId: string, e: Expense) {
  return {
    user_id: userId,
    id: e.id,
    amount: e.amount,
    description: e.description,
    category_id: e.categoryId,
    date: e.date,
    created_at: e.createdAt,
  }
}

// ── caricamento iniziale ──────────────────────────────────────────────────────

export interface PaystatsData {
  categories: Category[]
  expenses: Expense[]
  income: number
  currency: string
}

/**
 * Carica tutti i dati PayStats dell'utente. Al primo accesso (nessuna categoria)
 * crea le categorie di default e l'impostazione di reddito. Non semina spese
 * demo su un account reale.
 */
const DEFAULT_CURRENCY = 'EUR'

export async function loadAll(userId: string): Promise<PaystatsData> {
  if (!supabase) return { categories: DEFAULT_CATEGORIES, expenses: [], income: DEFAULT_INCOME, currency: DEFAULT_CURRENCY }

  const [catsRes, expRes, setRes] = await Promise.all([
    supabase.from('paystats_categories').select('id, name, color, icon, budget').eq('user_id', userId),
    supabase.from('paystats_expenses').select('id, amount, description, category_id, date, created_at').eq('user_id', userId).order('date', { ascending: true }),
    supabase.from('paystats_settings').select('income, currency').eq('user_id', userId).maybeSingle(),
  ])

  let categories = (catsRes.data as CategoryRow[] | null)?.map(rowToCategory) ?? []
  const expenses = (expRes.data as ExpenseRow[] | null)?.map(rowToExpense) ?? []

  // Primo accesso: semina le categorie di default.
  if (categories.length === 0) {
    await supabase.from('paystats_categories').insert(
      DEFAULT_CATEGORIES.map(c => categoryToRow(userId, c)),
    )
    categories = DEFAULT_CATEGORIES
  }

  const settings = setRes.data as { income: number; currency: string | null } | null
  let income = settings?.income ?? null
  if (income === null) {
    await supabase.from('paystats_settings').upsert({ user_id: userId, income: DEFAULT_INCOME, currency: DEFAULT_CURRENCY })
    income = DEFAULT_INCOME
  }

  return {
    categories,
    expenses,
    income: Number(income),
    currency: settings?.currency ?? DEFAULT_CURRENCY,
  }
}

// ── mutazioni (granulari) ─────────────────────────────────────────────────────

export async function upsertCategoryRemote(userId: string, c: Category) {
  if (!supabase) return
  await supabase.from('paystats_categories').upsert(categoryToRow(userId, c))
}

export async function deleteCategoryRemote(userId: string, id: string) {
  if (!supabase) return
  await supabase.from('paystats_categories').delete().eq('user_id', userId).eq('id', id)
}

export async function upsertExpenseRemote(userId: string, e: Expense) {
  if (!supabase) return
  await supabase.from('paystats_expenses').upsert(expenseToRow(userId, e))
}

export async function deleteExpenseRemote(userId: string, id: string) {
  if (!supabase) return
  await supabase.from('paystats_expenses').delete().eq('user_id', userId).eq('id', id)
}

export async function setIncomeRemote(userId: string, income: number) {
  if (!supabase) return
  await supabase.from('paystats_settings').upsert({ user_id: userId, income })
}

export async function setCurrencyRemote(userId: string, currency: string) {
  if (!supabase) return
  await supabase.from('paystats_settings').upsert({ user_id: userId, currency })
}
