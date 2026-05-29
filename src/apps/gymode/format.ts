import type { Unit } from './types'

export function formatWeight(value: number | undefined, unit: Unit): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  const n = value.toLocaleString('it-IT', { maximumFractionDigits: 1 })
  return `${n} ${unit}`
}
