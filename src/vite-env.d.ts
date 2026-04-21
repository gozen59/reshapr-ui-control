/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RESHAPR_SERVER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
