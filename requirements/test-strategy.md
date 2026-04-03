# Tagly — Test Strategy

**Owner**: Vader (QA & Security) | **Date**: 2026-04-02

---

## 1. Test Pyramid

### Unit Tests (70% of total tests)
- **Backend**: pytest + pytest-django
  - Model validation, custom field logic, status transitions
  - Serializer validation (postal code, phone, email)
  - QR generation (Segno + ReportLab PDF output)
  - Notification trigger logic
  - Audit trail signal/middleware correctness
- **Frontend**: Vitest + React Testing Library
  - Component rendering, props, state
  - Hook behavior (theme, i18n, offline sync)
  - Form validation logic
  - API service mocks

### Integration Tests (20% of total tests)
- **Backend**: pytest with live PostgreSQL + Redis
  - Full API request/response cycles (DRF test client)
  - Borrow/return state machine end-to-end
  - Custom field CRUD + value storage + filtering
  - Celery task execution (overdue notification flow)
  - Auth flow (login, session, permission checks)
  - Excel export with dynamic columns
- **Frontend**: Vitest with MSW (Mock Service Worker)
  - Page-level integration (route rendering, API data flow)
  - Offline queue: enqueue actions, sync on reconnect

### End-to-End Tests (10% of total tests)
- **Tool**: Playwright
  - Login flow
  - Asset onboarding via scanner (mocked camera)
  - Borrow and return cycle
  - Backoffice dashboard with real data
  - Admin: custom field configuration
  - Admin: QR PDF generation + download
  - Excel export download
  - Theme toggle, language switch
  - Mobile viewport tests for scanner flow

---

## 2. Coverage Targets

| Layer | Target |
|-------|--------|
| Backend unit | >= 80% line coverage |
| Backend integration | Critical paths 100% covered |
| Frontend unit | >= 75% line coverage |
| E2E | All user-facing workflows covered |

---

## 3. Security Testing Scope

- OWASP Top 10 alignment check
- Session management: fixation, cookie flags (HttpOnly, Secure, SameSite)
- CSRF protection on all state-changing endpoints
- Input validation: SQL injection, XSS, path traversal
- Authorization: IDOR checks (user accessing another user's data)
- Role enforcement: admin-only endpoints reject standard users
- Secrets: no credentials in logs, env vars not leaked in API responses
- Dependency audit: `pip audit` / `npm audit` in CI

---

## 4. Edge Cases to Cover

- Double-scan within milliseconds (race condition)
- Offline borrow + server-side conflict (asset already borrowed)
- Overdue notification at exact boundary (borrowed_until == now)
- Custom field deletion with existing data
- Concurrent borrow attempts on same asset
- Very large export (1000+ assets with custom fields)
- Invalid QR code scanned (not a Tagly GUID)
- Expired session during offline sync
- Unicode in all text fields (names, addresses)

---

## 5. Tooling

| Purpose | Tool |
|---------|------|
| Backend unit/integration | pytest, pytest-django, pytest-cov, factory-boy |
| Frontend unit | Vitest, @testing-library/react, MSW |
| E2E | Playwright |
| Security scanning | pip audit, npm audit, ruff (security rules) |
| CI integration | GitHub Actions (see ci.yml) |

### E2E — how to run

- **CI**: Job `E2E – Playwright` (`.github/workflows/ci.yml`) installs Chromium, starts Django + Vite via `frontend/playwright.config.ts`, runs `npm run test:e2e`.
- **Local**: PostgreSQL + Redis must be reachable (e.g. `docker compose up -d db redis`). If Postgres is not on `localhost:5432`, set `DB_PORT`. Playwright uses ports **18008** / **15173** by default (not **8008** / **5173**) so a running full stack on the default ports is not accidentally reused. User seed: `python manage.py ensure_e2e_user` (or rely on Playwright’s backend startup). Scripts: `npm run test:e2e`, `npm run test:e2e:ui`.

---

## 6. Executable scenarios — Scanner, onboarding & Stammdaten (Vader / text-to-test)

Use these as **manual exploratory** or **automated** cases (Playwright + API). Preconditions: authenticated user; admin has configured at least one **ASSET** custom field unless noted.

### 6.1 Asset create / onboarding (API + UI)

| ID | Preconditions | Steps | Expected |
|----|---------------|-------|----------|
| OB-01 | At least one ASSET field definition exists | `POST /api/v1/assets/` with `name` only, no `custom_fields` | **400**; `custom_fields` errors list every missing field id |
| OB-02 | Mandatory STRING field | Submit onboarding UI with that field empty | **400** (API) / inline errors (UI); asset not created |
| OB-03 | Optional + mandatory fields | Send `custom_fields` with all ids; mandatory filled, optional empty/`null` where allowed | **201**; values persisted |
| OB-04 | Unknown field id in payload | `custom_fields: { "999999": "x" }` | **400**; unknown id error |
| OB-05 | No field definitions in system | `POST` with `{}` or no `custom_fields` | **201** (inventory still creatable) |
| OB-06 | No field definitions | `POST` with non-empty `custom_fields` | **400**; rejects stray keys |
| OB-07 | Select / multi-select | Invalid choice not in admin `choices` | **400** |
| OB-08 | Onboarding from scanner | Scan unknown QR → fill all Stammdaten → save | Asset **GUID** matches sticker; list/detail shows custom values |

### 6.2 QR scanner & cameras (device / browser)

| ID | Preconditions | Steps | Expected |
|----|---------------|-------|----------|
| SC-01 | Android with ≥2 cameras | Open scanner; note default preview | Prefer rear/world-facing label if enumerated; readable preview |
| SC-02 | Same | Tap **Next camera** | Preview switches; preference stored for session |
| SC-03 | Same | Enable **Cycle cameras automatically** | Preview rotates through devices every few seconds until disabled |
| SC-04 | Desktop webcam only | Open scanner | Single-camera hint or disabled switch; fallback `environment` if list empty |
| SC-05 | Permission denied | Deny camera | Clear error; no crash |
| SC-06 | Double-scan race | Flash two valid QRs quickly | At most one navigation; no duplicate creates |

### 6.3 Regression ties

- **OB-01–OB-07** map to `validate_asset_custom_fields_for_asset_create` (backend) and `validateAssetCustomFieldValuesForCreate` + `buildCustomFieldsPayload` (`frontend/src/utils/assetCustomFieldPayload.ts`).
- **SC-01–SC-04** map to `QRScannerService.listCameras`, sort order, `Scanner` page controls.
