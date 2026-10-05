/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Optional AI parse endpoint, e.g. "/api/parse". Leave empty for local-only parsing. */
  readonly VITE_AI_PARSE_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
