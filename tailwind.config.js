/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Palette neutra condivisa dalle app figlie (es. PayStats).
        // Scala "slate" elegante: dark = blu-grigio profondo, non nero.
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#3b4a61',  // hover forte / elementi
          800: '#334155',  // bordi, input, chip (dark)
          900: '#1e293b',  // card, sidebar, modali (dark)
          950: '#0f172a',  // sfondo app (dark)
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-lg': '0 4px 24px -4px rgba(99,102,241,.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
