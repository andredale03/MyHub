import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

// Chiave unica condivisa con l'hub: così il tema resta sincronizzato quando si
// passa tra hub e app figlie. `paystats_theme` resta come fallback storico.
const THEME_KEY = 'hub-theme'
const LEGACY_KEY = 'paystats_theme'

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  const legacy = localStorage.getItem(LEGACY_KEY) as Theme | null
  if (legacy === 'light' || legacy === 'dark') return legacy
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Scrive la chiave unica (e mantiene allineata quella legacy).
    localStorage.setItem(THEME_KEY, theme)
    localStorage.setItem(LEGACY_KEY, theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  return { theme, toggle }
}
