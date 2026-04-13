/**
 * LC-2 … LC-9 domain regression: custom fields, QR PDF, onboarding FE≡BE, borrow/return, overdue, cleanup.
 * Persona: Luke (API + domain rules); uses R2-D2 helpers for manage.py hooks.
 */
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { apiGetJson, apiPostJson, apiPutJson } from './helpers/apiSession';
import { e2eCredentials } from './env';
import { runDjangoManage } from './helpers/runManage';

test.describe.configure({ mode: 'serial' });

const PREFIX = 'lc-e2e-';

/** MUI marks required fields with a trailing asterisk in the accessible name; `exact: true` then fails. */
function customFieldInput(page: Page, suffix: string) {
  return page.getByLabel(new RegExp(`^${PREFIX}${suffix}`));
}

interface DefRow {
  field_id: number;
  field_name: string;
  field_type: string;
  value: unknown;
}

function byFieldName(rows: DefRow[], name: string): unknown {
  return rows.find((r) => r.field_name === name)?.value;
}

test.describe('LC domain lifecycle (Luke)', () => {
  test.setTimeout(300_000);

  test('LC-2 — LC-9 full cycle', async ({ page }) => {
    // LC-9 prep: clean leftover data from aborted runs
    runDjangoManage(['e2e_cleanup_lc']);

    // LC-1 (auth) — same as wiring spec, required for session
    await page.goto('/login');
    await page.getByLabel('Username').fill(e2eCredentials.username);
    await page.getByLabel('Password').fill(e2eCredentials.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // LC-2 (admin UI smoke): custom-fields screen reachable for E2E admin
    await page.goto('/admin/custom-fields');
    await expect(page.getByRole('heading', { name: /Administration/i })).toBeVisible();

    // LC-2 — ASSET definitions (all types + validation) via API (stable + fast)
    const assetDefBodies = [
      {
        name: `${PREFIX}astr`,
        entity_type: 'ASSET',
        field_type: 'STRING',
        is_mandatory: true,
        options: {},
        validation_rules: { min_length: 2, max_length: 80 },
        display_order: 0,
      },
      {
        name: `${PREFIX}adat`,
        entity_type: 'ASSET',
        field_type: 'DATE',
        is_mandatory: false,
        options: {},
        validation_rules: {},
        display_order: 1,
      },
      {
        name: `${PREFIX}anum`,
        entity_type: 'ASSET',
        field_type: 'NUMBER',
        is_mandatory: true,
        options: {},
        validation_rules: { min: 1, max: 10 },
        display_order: 2,
      },
      {
        name: `${PREFIX}adec`,
        entity_type: 'ASSET',
        field_type: 'DECIMAL',
        is_mandatory: false,
        options: {},
        validation_rules: { min: 0, max: 99.99 },
        display_order: 3,
      },
      {
        name: `${PREFIX}ass`,
        entity_type: 'ASSET',
        field_type: 'SINGLE_SELECT',
        is_mandatory: true,
        options: { choices: ['Alpha', 'Beta'] },
        validation_rules: {},
        display_order: 4,
      },
      {
        name: `${PREFIX}ams`,
        entity_type: 'ASSET',
        field_type: 'MULTI_SELECT',
        is_mandatory: false,
        options: { choices: ['X', 'Y'] },
        validation_rules: {},
        display_order: 5,
      },
    ];

    const assetDefIds: number[] = [];
    for (const body of assetDefBodies) {
      const created = await apiPostJson<{ id: number }>(page, '/custom-fields/definitions/', body);
      assetDefIds.push(created.id);
    }

    const listAsset = await apiGetJson<{ results: { id: number; name: string }[]; count: number }>(
      page,
      '/custom-fields/definitions/',
      { entity_type: 'ASSET', page_size: '2000' },
    );
    expect(listAsset.count).toBeGreaterThanOrEqual(assetDefIds.length);
    for (const id of assetDefIds) {
      expect(listAsset.results.some((r) => r.id === id)).toBeTruthy();
    }

    // LC-3 — CUSTOMER definitions
    const customerDefBodies = [
      {
        name: `${PREFIX}cstr`,
        entity_type: 'CUSTOMER',
        field_type: 'STRING',
        is_mandatory: true,
        options: {},
        validation_rules: { min_length: 1 },
        display_order: 0,
      },
      {
        name: `${PREFIX}cnum`,
        entity_type: 'CUSTOMER',
        field_type: 'NUMBER',
        is_mandatory: false,
        options: {},
        validation_rules: { min: 0, max: 5 },
        display_order: 1,
      },
      {
        name: `${PREFIX}cdec`,
        entity_type: 'CUSTOMER',
        field_type: 'DECIMAL',
        is_mandatory: true,
        options: {},
        validation_rules: { min: 0, max: 10 },
        display_order: 2,
      },
      {
        name: `${PREFIX}cdat`,
        entity_type: 'CUSTOMER',
        field_type: 'DATE',
        is_mandatory: false,
        options: {},
        validation_rules: {},
        display_order: 3,
      },
      {
        name: `${PREFIX}css`,
        entity_type: 'CUSTOMER',
        field_type: 'SINGLE_SELECT',
        is_mandatory: true,
        options: { choices: ['Red', 'Blue'] },
        validation_rules: {},
        display_order: 4,
      },
      {
        name: `${PREFIX}cms`,
        entity_type: 'CUSTOMER',
        field_type: 'MULTI_SELECT',
        is_mandatory: false,
        options: { choices: ['P', 'Q'] },
        validation_rules: {},
        display_order: 5,
      },
    ];

    const customerDefIds: number[] = [];
    for (const body of customerDefBodies) {
      const created = await apiPostJson<{ id: number }>(page, '/custom-fields/definitions/', body);
      customerDefIds.push(created.id);
    }

    // LC-4 — QR PDF (UI). Fresh DBs have no sticker templates; the Generate button stays disabled
    // until a template exists and one is selected (auto-selected when is_default is true).
    await apiPostJson(page, '/qr/templates/', {
      name: `${PREFIX}qr-template`,
      label_width_mm: 80,
      label_height_mm: 45,
      h_pitch_mm: 90,
      v_pitch_mm: 50,
      left_margin_mm: 15,
      top_margin_mm: 15,
      rows: 2,
      columns: 2,
      offset_x_mm: 0,
      offset_y_mm: 0,
      is_default: true,
    });

    await page.goto('/qr-generate');
    await expect(page.getByRole('heading', { name: /Generate QR Stickers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate PDF/i })).toBeEnabled({ timeout: 15_000 });
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Generate PDF/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const pdfPath = await download.path();
    expect(pdfPath).toBeTruthy();

    // LC-5 — onboard two assets (UI) + FE ≡ BE
    const guid1 = randomUUID();
    const guid2 = randomUUID();

    const customPayload1: Record<string, unknown> = {
      [String(assetDefIds[0])]: 'Hello',
      [String(assetDefIds[1])]: '2026-06-15',
      [String(assetDefIds[2])]: 5,
      [String(assetDefIds[3])]: 1.25,
      [String(assetDefIds[4])]: 'Alpha',
      [String(assetDefIds[5])]: ['X'],
    };

    async function onboardViaUi(guid: string, label: string): Promise<number> {
      await page.goto(`/scanner/onboard/${encodeURIComponent(guid)}`);
      await expect(page.getByRole('heading', { name: /Register New Asset/i })).toBeVisible();

      await page
        .getByRole('textbox', { name: /Display name|Anzeigename/i })
        .fill(label === 'uno' ? `${PREFIX}asset-uno` : `${PREFIX}asset-duo`);

      await customFieldInput(page, 'astr').fill(label === 'uno' ? 'Hello' : 'World');
      const dateInput = page.locator(`input[type="date"]`).first();
      if (label === 'uno') {
        await dateInput.fill('2026-06-15');
      }
      await customFieldInput(page, 'anum').fill(label === 'uno' ? '5' : '7');
      const dec = customFieldInput(page, 'adec');
      if (label === 'uno') {
        await dec.fill('1.25');
      } else {
        await dec.clear();
      }
      await customFieldInput(page, 'ass').click();
      await page.getByRole('option', { name: label === 'uno' ? 'Alpha' : 'Beta' }).click();

      const multiCombo = page.getByRole('combobox', { name: new RegExp(`^${PREFIX}ams`) });
      await multiCombo.click();
      if (label === 'uno') {
        await page.getByRole('option', { name: 'X' }).click();
      } else {
        await page.getByRole('option', { name: 'Y' }).click();
      }
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: /Register Asset|Objekt erfassen/i }).click();
      const detailOrEdit = page.getByRole('button', { name: /^(Edit|Bearbeiten)$/i });
      await expect(detailOrEdit).toBeVisible({ timeout: 60_000 });

      await detailOrEdit.click();
      await page.waitForURL(/\/assets\/\d+/);
      const m = page.url().match(/\/assets\/(\d+)/);
      expect(m).toBeTruthy();
      return Number(m![1]);
    }

    const assetId1 = await onboardViaUi(guid1, 'uno');
    const assetId2 = await onboardViaUi(guid2, 'duo');

    const detail1 = await apiGetJson<{ custom_field_values: DefRow[]; name: string }>(
      page,
      `/assets/${assetId1}/`,
    );
    expect(detail1.name).toBe(`${PREFIX}asset-uno`);
    const rows1 = detail1.custom_field_values;
    expect(byFieldName(rows1, `${PREFIX}astr`)).toBe('Hello');
    expect(byFieldName(rows1, `${PREFIX}anum`)).toBe(5);
    expect(Number(byFieldName(rows1, `${PREFIX}adec`))).toBeCloseTo(1.25, 5);
    expect(byFieldName(rows1, `${PREFIX}ass`)).toBe('Alpha');
    expect(byFieldName(rows1, `${PREFIX}ams`)).toEqual(['X']);

    const detail2 = await apiGetJson<{ custom_field_values: DefRow[] }>(page, `/assets/${assetId2}/`);
    const rows2 = detail2.custom_field_values;
    expect(byFieldName(rows2, `${PREFIX}astr`)).toBe('World');
    expect(byFieldName(rows2, `${PREFIX}anum`)).toBe(7);
    expect(byFieldName(rows2, `${PREFIX}ass`)).toBe('Beta');
    expect(byFieldName(rows2, `${PREFIX}ams`)).toEqual(['Y']);

    // Seed “existing” customer for LC-6 path B (+ customer custom field values)
    const existingCustomer = await apiPostJson<{ id: number }>(page, '/customers/', {
      first_name: 'Lc',
      last_name: 'E2e Existing',
      address: 'Test Street 1',
      postal_code: '1010',
      city: 'Vienna',
      country: 'AT',
      phone: '+431234567890',
      email: `existing${Date.now()}@lc-e2e.local`,
    });

    const custVals: Record<string, unknown> = {
      [String(customerDefIds[0])]: 'note',
      [String(customerDefIds[1])]: 3,
      [String(customerDefIds[2])]: 2.5,
      [String(customerDefIds[3])]: '2025-01-01',
      [String(customerDefIds[4])]: 'Red',
      [String(customerDefIds[5])]: ['P', 'Q'],
    };
    await apiPutJson(page, `/custom-fields/values/customer/${existingCustomer.id}/`, { values: custVals });

    // LC-6 — borrow asset 1: new customer (UI)
    await page.goto(`/scanner/borrow/${assetId1}`);
    // Borrow screen renders two headings with the same title (card + form); strict mode needs one match.
    await expect(page.getByRole('heading', { name: /Lend Asset|Objekt ausleihen/i }).first()).toBeVisible();
    await page.getByLabel(/First Name|Vorname/i).fill('New');
    await page.getByLabel(/Last Name|Nachname/i).fill('Borrower');
    await page.getByLabel(/Address|Adresse/i).fill('Lane 2');
    await page.getByLabel(/Postal Code|Postleitzahl/i).fill('1020');
    await page.getByLabel(/City|Stadt/i).fill('Graz');
    await page.getByLabel(/Country|Land/i).click();
    await page.getByRole('option', { name: /Austria|Österreich/i }).click();
    // Must pass django-phonenumber-field / phonenumbers is_valid_number (e.g. +439998887766 is invalid AT).
    await page.getByLabel(/Phone Number|Telefonnummer/i).fill('+431234567890');
    await page.getByLabel(/Email \(optional\)|E-Mail \(optional\)/i).fill(`newborrower${Date.now()}@lc-e2e.local`);

    const future = new Date();
    future.setDate(future.getDate() + 7);
    const pad = (n: number) => String(n).padStart(2, '0');
    const untilStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    await page.getByLabel(/Return By|Rückgabe bis/i).fill(untilStr);
    await page.getByRole('button', { name: /Confirm Lending|Ausleihe bestätigen/i }).click();
    await expect(page.getByText(/Asset lent successfully|Objekt erfolgreich ausgeliehen/i)).toBeVisible({
      timeout: 60_000,
    });

    // LC-6 — borrow asset 2: existing customer (UI autocomplete)
    await page.goto(`/scanner/borrow/${assetId2}`);
    await expect(page.getByRole('heading', { name: /Lend Asset|Objekt ausleihen/i }).first()).toBeVisible();
    const search = page.getByRole('combobox', { name: /Search existing customer|Bestehenden Kunden suchen/i });
    // Backend search matches each field separately (not "first + last"); "Lc E2e" matches neither full field.
    await search.fill('E2e Existing');
    await page.getByRole('option', { name: /Lc E2e Existing/ }).click();
    await page.getByLabel(/Return By|Rückgabe bis/i).fill(untilStr);
    await page.getByRole('button', { name: /Confirm Lending|Ausleihe bestätigen/i }).click();
    await expect(page.getByText(/Asset lent successfully|Objekt erfolgreich ausgeliehen/i)).toBeVisible({
      timeout: 60_000,
    });

    // Overdue borrow on a third asset (API) for LC-8
    const guid3 = randomUUID();
    const cf3: Record<string, unknown> = {};
    for (const id of assetDefIds) {
      cf3[String(id)] = customPayload1[String(id)]!;
    }
    const assetOverdue = await apiPostJson<{ id: number }>(page, '/assets/', {
      guid: guid3,
      name: `${PREFIX}asset-overdue`,
      custom_fields: cf3,
    });
    const overdueUntil = new Date(Date.now() - 2 * 86400000).toISOString();
    await apiPostJson(page, '/borrowing/create/', {
      asset_id: assetOverdue.id,
      customer_id: existingCustomer.id,
      borrowed_from: new Date(Date.now() - 5 * 86400000).toISOString(),
      borrowed_until: overdueUntil,
      notes: 'lc-e2e overdue',
    });

    // LC-7 — return asset 1 (partial: asset 2 still borrowed)
    const history1 = await apiGetJson<{ results: { id: number; status: string }[] }>(
      page,
      `/borrowing/asset/${assetId1}/history/`,
    );
    const activeBorrow1 = history1.results.find((r) => r.status === 'ACTIVE');
    expect(activeBorrow1).toBeTruthy();

    await page.goto(`/scanner/return/${assetId1}`);
    await expect(page.getByRole('heading', { name: /Return Asset|Objekt zurückgeben/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Confirm Return|Rückgabe bestätigen/i }).click();
    await expect(page.getByText(/Asset returned successfully|Objekt erfolgreich zurückgegeben/i)).toBeVisible({
      timeout: 60_000,
    });

    // LC-8 — overdue notification
    runDjangoManage(['run_overdue_check']);
    const notifs = await apiGetJson<{ results: { status: string; notification_type: string }[] }>(
      page,
      '/notifications/',
      { notification_type: 'OVERDUE' },
    );
    const sent = notifs.results.filter((n) => n.status === 'SENT' && n.notification_type === 'OVERDUE');
    expect(sent.length).toBeGreaterThan(0);

    // LC-9 — teardown
    runDjangoManage(['e2e_cleanup_lc']);

    // Optional: definitions removed — verify count dropped (best-effort)
    const after = await apiGetJson<{ results: { name: string }[] }>(page, '/custom-fields/definitions/', {
      page_size: '2000',
    });
    expect(after.results.every((r) => !r.name.startsWith(PREFIX))).toBeTruthy();
  });
});
