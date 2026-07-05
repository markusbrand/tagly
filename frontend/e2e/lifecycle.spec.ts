import { test, expect } from '@playwright/test';
import { e2eCredentials } from './env';

import { randomUUID } from 'node:crypto';

test.describe('Asset Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Username|Benutzername/i).fill(e2eCredentials.username);
    await page.getByLabel(/Password|Passwort/i).fill(e2eCredentials.password);
    await page.getByRole('button', { name: /Sign In|Anmelden/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should onboard, borrow, and return an asset', async ({ page }) => {
    const assetName = `E2E Asset ${Date.now()}`;
    const guid = randomUUID();

    // 1. Onboarding
    await page.goto(`/scanner/onboard/${guid}`);
    await page.getByLabel(/Display name|Anzeigename/i).fill(assetName);

    // Handle any mandatory custom fields
    const mandatoryFields = await page.locator('input:required').all();
    for (const field of mandatoryFields) {
        const val = await field.inputValue();
        if (val === '') {
            const type = await field.getAttribute('type');
            if (type === 'number') {
                await field.fill('5');
            } else if (type === 'date') {
                await field.fill('2026-01-01');
            } else {
                try {
                    await field.fill('E2E Value');
                } catch {
                    // Ignore if field is not fillable
                }
            }
        }
    }

    await page.getByRole('button', { name: /Register Asset|Objekt erfassen/i }).click();

    // In current implementation, success shows an "Edit" button (t('common.edit')) to go to detail
    const editBtn = page.getByRole('button', { name: /^(Edit|Bearbeiten)$/i });
    if (!await editBtn.isVisible().catch(() => false)) {
        // Scroll or wait more if needed
        await page.mouse.wheel(0, 500);
    }
    await expect(editBtn).toBeVisible({ timeout: 30000 });
    await editBtn.click();

    await expect(page).toHaveURL(/\/assets\/\d+/);
    await expect(page.getByText(assetName)).toBeVisible();

    // 2. Borrow
    const assetId = page.url().split('/').pop();
    await page.goto(`/scanner/borrow/${assetId}`);

    await page.getByLabel(/First Name|Vorname/i).fill('E2E');
    await page.getByLabel(/Last Name|Nachname/i).fill('Borrower');
    await page.getByLabel(/Address|Adresse/i).fill('Test Lane 1');
    await page.getByLabel(/Postal Code|Postleitzahl/i).fill('12345');
    await page.getByLabel(/City|Stadt/i).fill('Test City');
    await page.getByLabel(/Country|Land/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/Phone Number|Telefonnummer/i).fill('+431234567890');

    // Fill "Return By" date which is mandatory for the button to enable
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const pad = (n: number) => String(n).padStart(2, '0');
    const untilStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T12:00`;
    await page.getByLabel(/Return By|Rückgabe bis/i).fill(untilStr);

    await page.getByRole('button', { name: /Confirm Lending|Ausleihe bestätigen/i }).click();
    await expect(page.getByText(/Asset lent successfully|Objekt erfolgreich ausgeliehen/i)).toBeVisible();

    // 3. Return
    await page.goto(`/scanner/return/${assetId}`);
    await page.getByRole('button', { name: /Confirm Return|Rückgabe bestätigen/i }).click();
    await expect(page.getByText(/Asset returned successfully|Objekt erfolgreich zurückgegeben/i)).toBeVisible();
  });
});
