import { expect, test } from '@playwright/test';
import { e2eCredentials } from './env';

test.describe.configure({ mode: 'serial' });

test.describe('Login', () => {
  test('shows app title on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Tagly' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('successful login navigates to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(e2eCredentials.username);
    await page.getByLabel('Password').fill(e2eCredentials.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(e2eCredentials.username);
    await page.getByLabel('Password').fill('wrong-password-for-e2e');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
