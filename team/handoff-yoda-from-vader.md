# Handoff an Yoda (von Vader) — Tests, CI, Befunde

**Datum**: 2026-04-03  
**Kontext**: Erneuter Review-Zyklus (Yoda-Koordination). **R2-D2**-Setup (`team/r2d2.md`, Abschnitte A–F + „Was geändert wurde“) gegen **Ist-Stand** im Repo abgeglichen; **Vader**-Sicherheits-/Readiness-Raster aus `team/vader.md` (Recorded review + generische OWASP-Heuristik).

---

## Erledigt (Vader + Abgleich R2-D2)

### Automatisierte Nachweise (lokal, 2026-04-03)

| Pfad | Ergebnis |
|------|----------|
| Backend `ruff check .` | grün |
| Backend `pytest` | **37 passed** (3 Deprecation-Warnings, pytest-Umgebung) |
| Backend `manage.py spectacular --validate --fail-on-warn` | grün |
| Frontend `npm ci` + `npm run lint` + `npm run test` + `npm run build` | grün (**9** Vitest-Fälle) |

CI (`.github/workflows/ci.yml`): Backend Lint/Test/OpenAPI; Frontend `npm ci` → lint → test → build — **mit aktuellem Repo konsistent**.

### R2-D2 — Setup vs. Code (Kurz)

| Thema | Erwartung (r2d2.md) | Repo-Ist |
|-------|----------------------|----------|
| Ein-Tunnel + `/api`-Proxy | `VITE_API_URL` default relativ, Vite proxy → Django | `docker-compose.yml` `VITE_API_URL` default `/api/v1`; `vite.config.ts` `/api` → `VITE_DEV_PROXY_TARGET`, `changeOrigin: false`, `xfwd`, Proxy-Error-Logging |
| Frontend wartet auf Backend | `depends_on` + healthcheck | `frontend` → `backend: service_healthy`; Backend healthcheck `curl` `/api/v1/health/` |
| Cookies / CSRF / CORS | Allowlists, `DJANGO_BEHIND_HTTPS_PROXY` | `settings.py` `_split_env_list`, `CORS_*`/`CSRF_*`, HTTPS-Proxy-Block |
| PWA / SW | Same-origin API nicht falsch wrappen; Dev kein SW | `sw.js` nur same-origin; `main.tsx` SW nur prod, Dev unregister |
| Client API | Relative Base URL, kein Lärm bei erwartetem 401 auf `/users/me` | `api.ts` wie dokumentiert |

**Fazit R2-D2-Abgleich:** Implementierung entspricht der dokumentierten **empfohlenen** Betriebsart (Abschnitt A). Optionaler Split-Host (B) bleibt über volle `VITE_API_URL` möglich.

### Vader — Sicherheit & Readiness (keine neuen Blocker)

- **Bekannte Restrisiken** (unverändert sinnvoll, siehe `team/vader.md` *Recorded review*): kein App-Rate-Limit auf Login; `ALLOWED_HOSTS` default `*` in Compose nur für Dev — Produktion explizit setzen; Vite `allowedHosts` inkl. `.brandstaetter.rocks` bewusst breit; Forwarded-Header nur sinnvoll wenn Traffic nur über vertrauenswürdigen Proxy.
- **Kritisch:** keine neuen Funde im geprüften Stand relativ zur dokumentierten Deployment-Annahme (HTTPS am Browser, Tunnel zum Origin, Secrets in `.env`).

### Build-Hinweis (niedrig, Leia optional)

- Vite meldet große JS-Chunks (>500 kB) — **Performance-Follow-up**, kein CI-Fail.

---

## Playwright E2E (seit späterer Commit; Stand Repo)

- **CI**: Job **`E2E – Playwright`** in `.github/workflows/ci.yml` — Postgres + Redis Services, Backend-Pip-Install, `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e`.
- **Config**: `frontend/playwright.config.ts` — startet Django (`migrate`, `ensure_e2e_user`, `runserver`) dann Vite dev mit `/api`-Proxy; **CI** Ports **8008 / 5173**, **lokal** Standard **18008 / 15173** (kollidiert nicht mit laufendem `docker compose`).
- **User-Seed**: `python manage.py ensure_e2e_user` (`backend/users/management/commands/ensure_e2e_user.py`), Credentials über **`E2E_USERNAME`** / **`E2E_PASSWORD`** (CI setzt feste Testwerte).
- **Specs**: `frontend/e2e/login.spec.ts` (Login-UI, Erfolg, Fehlversuch), `frontend/e2e/routes.spec.ts` (Redirect zu `/login`).
- **Skripte**: `npm run test:e2e`, `npm run test:e2e:ui`.

## Nicht ausgeführt (Scope-Grenze)

- **Manueller Browser** / Tunnel-Pi: weiterhin kein Pflichtteil der automatisierten Gates.
- **Breitere E2E-Abdeckung** (Onboarding, Scanner, Admin): laut `requirements/test-strategy.md` noch offen / iterativ.

---

## Definition of Done (Review 2026-04-03 + E2E)

- [x] CI-Pfade verifiziert (lokal analog CI).
- [x] R2-D2-Dokument vs. `docker-compose`, Vite, `api.ts`, `sw.js`, `main.tsx`, Django settings — konsistent.
- [x] Vader-Raster: keine neuen Blocker; Restrisiken benannt.
- [x] E2E: Playwright + CI-Job + Kernflows (Login + geschützte Route).

---

## Frühere Runde (Archiv-Kurz, 2026-04-02)

- DECIMAL/min/max, ESLint react-refresh, Vitest/CI — siehe Git-Historie; obige Tabelle ersetzt nicht die technischen Fixes von damals, sondern ergänzt den **aktuellen** Status.
