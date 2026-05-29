/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** 'true' per saltare login/abbonamento sulle app (solo sviluppo). */
  readonly VITE_AUTH_BYPASS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
