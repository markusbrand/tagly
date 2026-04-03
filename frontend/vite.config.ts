import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Public hostnames (e.g. Cloudflare Tunnel) must be listed — Vite blocks other Host headers by default.
const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().replace(/^https?:\/\//i, '').split('/')[0])
  .filter(Boolean)

/** When the dev server is reached via Cloudflare Tunnel (HTTPS public host), set e.g. VITE_DEV_PUBLIC_HOST=tagly.brandstaetter.rocks so HMR uses wss:443. */
const devPublicHost = (process.env.VITE_DEV_PUBLIC_HOST ?? '').trim()
const devHmr =
  devPublicHost.length > 0
    ? {
        protocol: (process.env.VITE_DEV_HMR_PROTOCOL === 'ws' ? 'ws' : 'wss') as 'ws' | 'wss',
        host: devPublicHost,
        clientPort: Number(process.env.VITE_DEV_HMR_CLIENT_PORT ?? 443) || 443,
      }
    : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'tagly.brandstaetter.rocks',
      '.brandstaetter.rocks',
      ...extraAllowedHosts,
    ],
    ...(devHmr ? { hmr: devHmr } : {}),
  },
})
