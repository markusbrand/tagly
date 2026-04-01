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
