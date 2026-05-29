// Formattazione valuta centralizzata per PayStats.

export interface CurrencyDef {
  code: string
  symbol: string
  label: string
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'USD', symbol: '$', label: 'Dollaro USA ($)' },
  { code: 'GBP', symbol: '£', label: 'Sterlina (£)' },
  { code: 'CHF', symbol: 'CHF ', label: 'Franco svizzero (CHF)' },
  { code: 'JPY', symbol: '¥', label: 'Yen (¥)' },
]

export const DEFAULT_CURRENCY = 'EUR'

export function currencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? '€'
}

/**
 * Formatta un importo con il simbolo della valuta scelta, usando la
 * formattazione numerica it-IT (coerente con tutta l'app). `decimals` controlla
 * le cifre decimali (0 per i totali grandi, 2 per i dettagli/tooltip).
 */
export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY, decimals = 0): string {
  const n = amount.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${currencySymbol(currency)}${n}`
}
