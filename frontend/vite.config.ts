import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Public hostnames (e.g. Cloudflare Tunnel) must be listed — Vite blocks other Host headers by default.
const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().replace(/^https?:\/\//i, '').split('/')[0])
  .filter(Boolean)

/** When the dev server is reached via Cloudflare Tunnel (HTTPS public host), set e.g. VITE_DEV_PUBLIC_HOST=tagly.brandstaetter.rocks so HMR uses wss:443. */
const devPublicHost = (process.env.VITE_DEV_PUBLIC_HOST ?? '').trim()
/** Public origin the browser uses (https://…). Helps module URLs behind a reverse proxy / tunnel. Override with VITE_DEV_PUBLIC_ORIGIN if needed. */
const devPublicOrigin =
  devPublicHost.length > 0
    ? (process.env.VITE_DEV_PUBLIC_ORIGIN ?? `https://${devPublicHost}`).trim()
    : undefined
const devHmr =
  devPublicHost.length > 0
    ? {
        protocol: (process.env.VITE_DEV_HMR_PROTOCOL === 'ws' ? 'ws' : 'wss') as 'ws' | 'wss',
        host: devPublicHost,
        clientPort: Number(process.env.VITE_DEV_HMR_CLIENT_PORT ?? 443) || 443,
      }
    : undefined

/**
 * Proxy /api → Django so the browser uses same origin as the UI (e.g. https://tagly…/api/v1).
 * Avoids CORS + second Cloudflare tunnel to tagly-backend… during dev.
 * changeOrigin: false keeps the browser Host (e.g. tagly.brandstaetter.rocks) so session cookies match.
 */
const proxyTarget = (process.env.VITE_DEV_PROXY_TARGET ?? 'http://127.0.0.1:8008').trim()
const devProxy =
  proxyTarget.length > 0
    ? {
        '/api': {
          target: proxyTarget,
          changeOrigin: false,
          secure: false,
          xfwd: true,
          timeout: 120_000,
          configure: (proxy: unknown) => {
            // http-proxy — log upstream failures (e.g. backend down, wrong VITE_DEV_PROXY_TARGET).
            ;(proxy as { on: (e: string, cb: (err: Error) => void) => void }).on(
              'error',
              (err: Error) => {
                console.error(
                  '[vite] /api proxy error:',
                  err.message,
                  '| target:',
                  proxyTarget,
                  '| If Vite runs on the Pi host (not Docker), use VITE_DEV_PROXY_TARGET=http://127.0.0.1:8008 (not http://backend:8008).',
                )
              },
            )
          },
        },
      }
    : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    ...(devPublicOrigin ? { origin: devPublicOrigin } : {}),
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'tagly.brandstaetter.rocks',
      '.brandstaetter.rocks',
      ...extraAllowedHosts,
    ],
    ...(devHmr ? { hmr: devHmr } : {}),
    ...(devProxy ? { proxy: devProxy } : {}),
  },
})
