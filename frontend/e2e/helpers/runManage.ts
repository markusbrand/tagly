import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const backendRoot = path.resolve(process.cwd(), '..', 'backend');
const venvPy = path.join(backendRoot, '.venv', 'bin', 'python');
const python = existsSync(venvPy) ? venvPy : (process.env.PYTHON ?? 'python');

/**
 * Run Django management command against the same backend tree as Playwright’s webServer.
 * Ownership: R2-D2 (wiring) + Luke (domain commands).
 */
export function runDjangoManage(args: string[]): string {
  try {
    return execFileSync(python, ['manage.py', ...args], {
      cwd: backendRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        ALLOWED_HOSTS: process.env.ALLOWED_HOSTS ?? '*',
        DB_CONN_MAX_AGE: process.env.DB_CONN_MAX_AGE ?? '0',
        // Must match playwright.config.ts backendWebEnv: overdue task uses send_mail; without this CI defaults to SMTP and logs FAILED instead of SENT.
        EMAIL_BACKEND:
          process.env.EMAIL_BACKEND ?? 'django.core.mail.backends.locmem.EmailBackend',
      },
    });
  } catch (e) {
    const err = e as { stderr?: Buffer; stdout?: Buffer; message?: string };
    const msg = [err.stderr?.toString(), err.stdout?.toString(), err.message]
      .filter(Boolean)
      .join('\n');
    throw new Error(`manage.py ${args.join(' ')} failed:\n${msg}`);
  }
}
