import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, '..', 'backend');

/** Prefer `backend/.venv` so Playwright matches `scripts/e2e-local.sh` and avoids system Python without Django. */
const backendVenvPython = join(backendDir, '.venv', 'bin', 'python');
const djangoPython = existsSync(backendVenvPython) ? backendVenvPython : (process.env.PYTHON ?? 'python');

/** CI uses 8008/5173. Locally default 18008/15173 so a running `docker compose` UI/API on 8008/5173 does not get reused by mistake (that would skip migrate + ensure_e2e_user). */
const isCi = !!process.env.CI;
const backendPort = process.env.E2E_BACKEND_PORT ?? (isCi ? '8008' : '18008');
const frontendPort = process.env.E2E_FRONTEND_PORT ?? (isCi ? '5173' : '15173');
const backendOrigin = `http://127.0.0.1:${backendPort}`;
const frontendOrigin = `http://127.0.0.1:${frontendPort}`;

/** Sandbox Django from repo `.env` (often production-only ALLOWED_HOSTS) so Vite + Playwright origins work. */
const backendWebEnv = {
  ...process.env,
  /** Avoid holding Postgres connections (CONN_MAX_AGE=600 + many requests) — prevents “too many clients” on small local DBs. */
  DB_CONN_MAX_AGE: process.env.DB_CONN_MAX_AGE ?? '0',
  /** Overdue E2E (LC-8): real SMTP must not run in CI / local Playwright. */
  EMAIL_BACKEND: process.env.EMAIL_BACKEND ?? 'django.core.mail.backends.locmem.EmailBackend',
  ALLOWED_HOSTS: '*',
  CORS_ALLOWED_ORIGINS: [
    frontendOrigin,
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    backendOrigin,
  ].join(','),
  CSRF_TRUSTED_ORIGINS: [
    frontendOrigin,
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    backendOrigin,
  ].join(','),
};

/**
 * E2E: starts Django then Vite dev (same-origin /api proxy as in docker-compose).
 * Preconditions for local runs: PostgreSQL + Redis reachable (e.g. `docker compose up -d db redis`).
 * If Postgres is published on a non-default host port, set `DB_PORT` (e.g. `5433` when compose maps `5433:5432`).
 */
export default defineConfig({
  testDir: './e2e',
  /** LC lifecycle mutates shared DB; single worker avoids races with other specs. */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: frontendOrigin,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Order matters: backend first, then Vite (same order as in Playwright’s array semantics).
  webServer: [
    {
      command: `${djangoPython} manage.py migrate --noinput && ${djangoPython} manage.py ensure_e2e_user && ${djangoPython} manage.py runserver 0.0.0.0:${backendPort}`,
      cwd: backendDir,
      env: backendWebEnv as { [key: string]: string },
      url: `${backendOrigin}/api/v1/health/`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
      cwd: __dirname,
      env: {
        ...process.env,
        VITE_API_URL: '/api/v1',
        VITE_DEV_PROXY_TARGET: backendOrigin,
      } as { [key: string]: string },
      url: frontendOrigin,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
