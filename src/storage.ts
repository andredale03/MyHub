import { supabase } from './lib/supabase'

const STORAGE_KEY = 'hub-apps'
const PIN_KEY = 'hub-pin'

export interface AppEntry {
  id: string
  name: string
  description: string
  /** URL esterno (usato solo se `route` non è impostato). */
  url: string
  /** Route interna alla shell (es. "/app/paystats"). Se presente, l'app si apre dentro l'hub. */
  route?: string
  icon: string
  color: string
  status: 'live' | 'wip' | 'planned'
  order: number
}

export const DEFAULT_APPS: AppEntry[] = [
  {
    id: 'paystats',
    name: 'PayStats',
    description: 'Traccia le tue spese mensili, analizza budget per categoria e visualizza trend finanziari.',
    url: '',
    route: '/app/paystats',
    icon: '💰',
    color: 'from-indigo-500 to-purple-600',
    status: 'live',
    order: 0,
  },
]

export function loadApps(): AppEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APPS
    const parsed = JSON.parse(raw) as AppEntry[]
    return parsed.sort((a, b) => a.order - b.order)
  } catch {
    return DEFAULT_APPS
  }
}

export function saveApps(apps: AppEntry[]): void {
  const withOrder = apps.map((a, i) => ({ ...a, order: i }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withOrder))
}

/** Riga della tabella `apps` di Supabase. */
interface AppRow {
  id: string
  name: string
  description: string | null
  route: string | null
  url: string | null
  icon: string | null
  color: string | null
  status: string | null
  sort_order: number | null
}

function rowToEntry(r: AppRow, index: number): AppEntry {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    url: r.url ?? '',
    route: r.route ?? undefined,
    icon: r.icon ?? '🚀',
    color: r.color ?? 'from-indigo-500 to-purple-600',
    status: (r.status as AppEntry['status']) ?? 'live',
    order: r.sort_order ?? index,
  }
}

/**
 * Carica il catalogo dalla tabella `apps` di Supabase quando configurato.
 * In caso di errore, assenza di righe o modalità demo, ricade su localStorage
 * (`loadApps`). Mantiene anche una copia locale come cache di fallback.
 */
export async function fetchApps(): Promise<AppEntry[]> {
  if (!supabase) return loadApps()
  try {
    const { data, error } = await supabase
      .from('apps')
      .select('id, name, description, route, url, icon, color, status, sort_order')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) return loadApps()

    const apps = (data as AppRow[]).map(rowToEntry)
    // Cache locale: utile come fallback offline e per la modalità demo.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
    return apps
  } catch {
    return loadApps()
  }
}

export function loadPin(): string {
  return localStorage.getItem(PIN_KEY) ?? '1234'
}

export function savePin(pin: string): void {
  localStorage.setItem(PIN_KEY, pin)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}
