/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Dev-only middleware that serves POST /api/parse with the same handler as the
 * production serverless function (api/parse.ts). The API key only ever lives in
 * the Node process, never in the browser bundle.
 */
function aiParseDevServer(apiKey: string | undefined): Plugin {
  return {
    name: 'ai-parse-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/parse', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const { handleParseRequest } = await server.ssrLoadModule('/server/aiParse.ts');
        const result = await handleParseRequest(Buffer.concat(chunks).toString('utf8'), apiKey);
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
    },
    plugins: [
      react(),
      aiParseDevServer(env.ANTHROPIC_API_KEY),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
        manifest: {
          id: '/',
          name: 'Onze Week',
          short_name: 'Onze Week',
          description: 'Weekplanning, maaltijden en boodschappen in één rustige app.',
          lang: 'nl-NL',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#F3F6F4',
          theme_color: '#F3F6F4',
          categories: ['productivity', 'lifestyle', 'food'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Iets plannen', short_name: 'Plannen', url: '/#/vandaag?invoer=1' },
            { name: 'Boodschappen', short_name: 'Boodschappen', url: '/#/boodschappen' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
