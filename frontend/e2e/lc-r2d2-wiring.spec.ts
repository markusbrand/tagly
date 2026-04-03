/**
 * LC infrastructure: session, CSRF, API reachability, definition list pagination param.
 * Persona: R2-D2 (Playwright ↔ Django wiring, env parity with CI).
 */
import { expect, test } from '@playwright/test';
import { apiGetJson } from './helpers/apiSession';
import { e2eCredentials } from './env';

test.describe('LC wiring (R2-D2)', () => {
  test('LC-1 login + authenticated API + definitions page_size', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(e2eCredentials.username);
    await page.getByLabel('Password').fill(e2eCredentials.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const me = await apiGetJson<{ username: string }>(page, '/users/me/');
    expect(me.username).toBe(e2eCredentials.username);

    const defs = await apiGetJson<{ results: unknown[]; count: number }>(page, '/custom-fields/definitions/', {
      entity_type: 'ASSET',
      page_size: '2000',
    });
    expect(Array.isArray(defs.results)).toBeTruthy();
    expect(defs.count).toBeGreaterThanOrEqual(defs.results.length);
  });
});
