import { defineConfig } from 'vitest/config'

/** React plugin omitted: Vitest’s bundled Vite types clash with Vite 8 + @vitejs/plugin-react; pure `.ts` tests use the default transform. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
