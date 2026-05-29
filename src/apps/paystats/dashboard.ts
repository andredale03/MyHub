// Configurazione della dashboard personalizzabile di PayStats.

export type WidgetKey =
  | 'insights' | 'donut' | 'budget' | 'trend' | 'category' | 'calendar' | 'recent'

export interface WidgetMeta {
  key: WidgetKey
  label: string
  /** Occupa l'intera larghezza (col-span-2) invece di metà. */
  full: boolean
}

/** Elenco e ordine di default dei widget della dashboard. */
export const WIDGETS: WidgetMeta[] = [
  { key: 'insights', label: 'Smart Insights',        full: true  },
  { key: 'donut',    label: 'Distribuzione spese',   full: false },
  { key: 'budget',   label: 'Budget per categoria',  full: false },
  { key: 'trend',    label: 'Andamento giornaliero', full: true  },
  { key: 'category', label: 'Confronto categorie',   full: false },
  { key: 'calendar', label: 'Calendario spese',      full: false },
  { key: 'recent',   label: 'Ultime transazioni',    full: true  },
]

export interface WidgetState { key: WidgetKey; visible: boolean }

export const DEFAULT_LAYOUT: WidgetState[] = WIDGETS.map(w => ({ key: w.key, visible: true }))

const KEY = 'paystats_dashboard'
const META = new Map(WIDGETS.map(w => [w.key, w]))

export function widgetLabel(key: WidgetKey): string {
  return META.get(key)?.label ?? key
}

export function isFullWidth(key: WidgetKey): boolean {
  return META.get(key)?.full ?? true
}

/**
 * Carica il layout salvato (preferenza per-dispositivo), riconciliandolo con i
 * widget noti: scarta chiavi sconosciute e accoda eventuali widget nuovi.
 */
export function loadLayout(): WidgetState[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_LAYOUT
    const stored = JSON.parse(raw) as WidgetState[]
    const known = stored.filter(s => META.has(s.key))
    const missing = WIDGETS
      .filter(w => !known.some(s => s.key === w.key))
      .map(w => ({ key: w.key, visible: true }))
    return [...known, ...missing]
  } catch {
    return DEFAULT_LAYOUT
  }
}

export function saveLayout(layout: WidgetState[]): void {
  localStorage.setItem(KEY, JSON.stringify(layout))
}
