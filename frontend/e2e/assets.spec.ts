import { expect, test } from '@playwright/test';
import { e2eCredentials } from './env';

test.describe('Assets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(e2eCredentials.username);
    await page.getByLabel('Password').fill(e2eCredentials.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('authenticated user can open assets list', async ({ page }) => {
    await page.goto('/assets');
    await expect(page.getByRole('heading', { name: 'Assets', exact: true })).toBeVisible();
  });
});
