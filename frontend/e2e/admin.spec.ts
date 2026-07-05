import { test, expect } from '@playwright/test';
import { e2eCredentials } from './env';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Username|Benutzername/i).fill(e2eCredentials.username);
    await page.getByLabel(/Password|Passwort/i).fill(e2eCredentials.password);
    await page.getByRole('button', { name: /Sign In|Anmelden/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate through admin sections', async ({ page }) => {
    await page.goto('/admin/custom-fields');
    await expect(page.getByRole('heading', { name: /Administration/i })).toBeVisible();

    // Try finding tabs by text
    await page.getByText(/Sticker Templates|Etiketten-Vorlagen/i).first().click();
    // Wait for the "Add" Fab button which is present on both Custom Fields and Sticker Templates
    await expect(page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') })).toBeVisible();

    await page.getByText(/User Management|Benutzerverwaltung/i).first().click();
    await expect(page.getByText(/User Management|Benutzerverwaltung/i)).toBeVisible();
  });

  test('should create a custom field', async ({ page }) => {
    await page.goto('/admin/custom-fields');
    const fieldName = `lc-e2e-field-${Date.now()}`;

    // Add button is a Fab with AddIcon
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();

    await page.getByLabel(/Field Name|Feldname/i).fill(fieldName);
    await page.getByRole('button', { name: /Save|Speichern/i }).click();

    await expect(page.getByText(fieldName)).toBeVisible();
  });
});
