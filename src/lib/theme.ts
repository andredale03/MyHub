import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/** Chiave unica del tema condivisa tra hub e app figlie. */
export const THEME_KEY = 'hub-theme'
/** Chiavi storiche da migrare verso THEME_KEY (es. quella di PayStats). */
const LEGACY_KEYS = ['paystats_theme']

/** Legge il tema iniziale: chiave unica → chiave legacy → preferenza di sistema. */
export function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key)
    if (legacy === 'light' || legacy === 'dark') {
      localStorage.setItem(THEME_KEY, legacy)
      return legacy
    }
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Applica il tema al <html> (classe `dark`). */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Persiste il tema (chiave unica + legacy per compatibilità) e lo applica. */
export function storeTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
  // Mantiene allineata la chiave legacy finché le app figlie la leggono ancora.
  for (const key of LEGACY_KEYS) localStorage.setItem(key, theme)
  applyTheme(theme)
}

/**
 * Hook condiviso per il tema. Sorgente di verità unica (THEME_KEY), così hub e
 * app figlie restano sincronizzati: chi cambia tema scrive la stessa chiave.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = () =>
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      storeTheme(next)
      return next
    })

  return { theme, dark: theme === 'dark', toggle }
}
