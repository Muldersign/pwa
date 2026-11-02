/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` → installable PWA in dist/.
// `npm run build:single` → one self-contained HTML file (demo/preview, no service worker).
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: process.env.BASE_PATH ?? './',
    define: {
      __APP_VERSION__: JSON.stringify(
        `${process.env.npm_package_version ?? '1.0.0'} · build ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
      ),
      __SINGLE_FILE__: JSON.stringify(single),
    },
    resolve: single ? { alias: { 'virtual:pwa-register': '/src/lib/pwa-stub.ts' } } : undefined,
    build: single ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000 } : undefined,
    plugins: [
      react(),
      single
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg', 'sw-notify.js'],
            manifest: {
              id: './',
              name: 'Alignerly – Jessica’s beugeltracker',
              short_name: 'Alignerly',
              description: 'Houd met één tik bij hoe lang je aligner vandaag gedragen is.',
              lang: 'nl-NL',
              dir: 'ltr',
              start_url: './',
              scope: './',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#F8F5FF',
              theme_color: '#F8F5FF',
              categories: ['health', 'lifestyle', 'medical'],
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
              shortcuts: [
                { name: 'Kalender', short_name: 'Kalender', url: './#/kalender' },
                { name: 'Statistieken', short_name: 'Statistieken', url: './#/statistieken' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
              navigateFallback: 'index.html',
              cleanupOutdatedCaches: true,
              importScripts: ['sw-notify.js'],
            },
          }),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
