import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Public hostnames (e.g. Cloudflare Tunnel) must be listed — Vite blocks other Host headers by default.
const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

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
  },
})
