# Tagly — Asset tracking & lending

Tagly is a web application for tracking hardware, tools, and other assets that can be lent to customers. QR stickers identify assets; a **mobile-first scanner (PWA)** and a **desktop backoffice** cover day-to-day work.

**Documentation**

- **[docs/README.md](docs/README.md)** — Documentation index  
- **[docs/user-guide.md](docs/user-guide.md)** — End-user guide (roles, scanner, offline, troubleshooting)  
- **[docs/technical.md](docs/technical.md)** — Architecture, domain model, APIs, diagrams, CI/CD, security  
- **[requirements/architecture.md](requirements/architecture.md)** — Architecture decision record (ADR)

---

## Features (overview)

- QR sticker PDF generation with configurable templates  
- Mobile QR scanner: onboard, borrow, return  
- Backoffice: assets, search/filter, borrow history, Excel export  
- Admin-configurable custom fields for assets and customers  
- Offline scan queue with sync when online  
- Email notifications for overdue borrows (Celery + SMTP)  
- Audit trail, multi-language (EN/DE), light/dark theme  

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, MUI 7, Vite 8 |
| Backend | Django 5.1, Django REST Framework |
| Database | PostgreSQL 16 |
| Tasks | Celery + Redis |
| QR / PDF | Segno, ReportLab |
| Containers | Docker; backend image published to **GHCR** |
| CI | GitHub Actions |

---

## Prerequisites

- **Docker workflow:** Docker and Docker Compose  
- **Backend only:** Python 3.12+, PostgreSQL 16, Redis  
- **Frontend only:** Node.js 20+  

---

## Installation — full stack (recommended)

Uses Compose services: `db`, `redis`, `backend`, `celery_worker`, `celery_beat`, `frontend`.

```bash
git clone https://github.com/markusbrand/tagly.git
cd tagly
cp .env.example .env
```

If host ports **5432** or **6379** are already in use, set in `.env` for example:

- `POSTGRES_HOST_PORT=5433`  
- `REDIS_HOST_PORT=6380`  

(Containers still use `db:5432` and `redis:6379` internally.)

```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

**URLs (default)**

| Service | URL |
|---------|-----|
| Frontend (Vite dev) | http://localhost:5173 |
| API | http://localhost:8008/api/v1/ |
| Django admin | http://localhost:8008/admin/ |

If `migrate` was partially applied and errors persist, reset the DB volume (destroys local data):  
`docker compose down -v && docker compose up -d`, then migrate again.

**Docker troubleshooting — `ModuleNotFoundError` in the backend container**

After `backend/requirements.txt` changes, Docker may still use a **cached** image layer and the running venv can miss new packages (e.g. `No module named 'drf_spectacular'`). Rebuild and restart:

```bash
docker compose build backend
docker compose up -d
```

If the error persists, force a full dependency install (no layer cache):

```bash
docker compose build --no-cache backend
docker compose up -d
```

Celery services use the same image; recreating them picks up the new image automatically on `up -d`.

---

## Installation — backend (without Docker)

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Ensure PostgreSQL and Redis are running. Export configuration (example for local dev):

```bash
export DB_NAME=tagly DB_USER=tagly DB_PASSWORD=tagly_dev DB_HOST=localhost DB_PORT=5432
export REDIS_URL=redis://localhost:6379/0
export DJANGO_DEBUG=True
```

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8008
```

The API is served at `http://localhost:8008/api/v1/` (see `PORT` in `.env.example` if you change the port).

---

## Installation — frontend (without Docker)

```bash
cd frontend
npm install
npm run dev
```

Point the app at your API by setting **`VITE_API_URL`** (e.g. in `frontend/.env` or your shell) to the full API base, e.g. `http://localhost:8008/api/v1`.

**Production build**

```bash
npm run build
npm run preview   # optional local preview of dist/
```

Serve the `dist/` output with a static host or CDN; configure CORS and CSRF on Django for that origin (see `.env.example`).

---

## Celery (backend tasks)

Required for scheduled overdue checks and notification dispatch. From `backend/` with the same env as Django:

```bash
celery -A tagly worker -l info
celery -A tagly beat -l info
```

With Docker Compose, `celery_worker` and `celery_beat` services run these for you.

---

## Configuration

All settings are driven by environment variables. See **`.env.example`** for the full list and comments.

**Common variables**

| Variable | Purpose |
|----------|---------|
| `PORT` | Backend listen port (default `8008`) |
| `DB_*`, `REDIS_URL` | Database and Celery broker |
| `DJANGO_SECRET_KEY` | Required in production |
| `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Host and browser security |
| `VITE_API_URL` | Frontend → API base URL (must be reachable from the **browser**) |
| `VITE_DEV_PUBLIC_HOST` | (Dev only) Public UI hostname for HMR + `server.origin` behind HTTPS tunnel |
| `VITE_DEV_PUBLIC_ORIGIN` | (Dev only) Full public origin if not `https://` + `VITE_DEV_PUBLIC_HOST` |
| `VITE_DEV_PROXY_TARGET` | (Dev only) Django URL for the Vite `/api` proxy. **Docker Compose frontend container:** `http://backend:8008` (default in compose). **Vite on the Pi/host (no Docker):** `http://127.0.0.1:8008` — do **not** use `http://backend:8008` on the host (hostname does not exist). |
| `EMAIL_*` | SMTP for notifications |

**HTTPS / Cloudflare (dev with `npm run dev` / Compose frontend):** Prefer **one tunnel** to the Vite port and keep **`VITE_API_URL=/api/v1`** (Compose default). Vite **proxies** `/api` to Django (`VITE_DEV_PROXY_TARGET`, default `http://backend:8008` in Compose). The browser then calls `https://<your-ui-host>/api/v1/...` — **same origin**, no second hostname, no CORS for the API. Set **`DJANGO_BEHIND_HTTPS_PROXY=1`**, **`CSRF_TRUSTED_ORIGINS`** (and **`CORS_ALLOWED_ORIGINS`** if you still use a split API host elsewhere) to include **`https://<your-ui-host>`**, and **`ALLOWED_HOSTS`** to include that hostname (or `*` for home lab). If the console shows **502** to `https://tagly-backend…` with “CORS missing”, the **API origin is down or unreachable** (tunnel/DNS); the browser blames CORS because Cloudflare’s 502 page has no `Access-Control-Allow-Origin`. Fix the tunnel or switch to the **same-origin proxy** setup above.

**Split API hostname (optional):** If you set `VITE_API_URL=https://tagly-backend…/api/v1`, the browser calls that host directly — you need a **working** tunnel to Django, plus `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` including the UI origin.

**Vite dev through Cloudflare Tunnel (HMR):** If the browser shows `[vite] failed to connect to websocket`, set (in the environment that starts Vite) `VITE_DEV_PUBLIC_HOST` to your **public UI hostname** (no scheme), e.g. `tagly.brandstaetter.rocks`. That also sets **`server.origin`** to `https://<host>` so Vite generates correct URLs for pre-bundled deps (`/node_modules/.vite/deps/…`). Optional: `VITE_DEV_PUBLIC_ORIGIN` if the public URL is not `https://` + host; `VITE_DEV_HMR_CLIENT_PORT` (default `443`); `VITE_DEV_HMR_PROTOCOL` (`wss` default).

**Cloudflare 502 — “Host … Error” (and failed loads from `/node_modules/.vite/deps/`):** On the error page, if **Cloudflare** is OK but **Host** (your origin) is **Error**, the tunnel is not getting a valid HTTP response from the machine running Vite (wrong port, `cloudflared` down, container stopped, Pi asleep, or origin timeout). This affects **all** paths — dev chunks **and** `/api/` — not a Django-only issue. On the Pi: `docker compose ps`, `docker compose logs frontend backend --tail=80`, confirm the tunnel ingress targets **`http://127.0.0.1:5173`** (or your published port). From the Pi shell: `curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/` should be **200**, and `curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/api/v1/health/` should be **200** when the backend is up (Vite proxies to Django). For **stable** internet access, prefer **`npm run build`** and serve **`dist/`** behind nginx/Caddy with **`location /api/`** proxied to Django instead of exposing `npm run dev` long-term.

**Service worker / “503 Offline” on login:** The PWA service worker only wraps **same-origin** requests. If the UI and API use **different hostnames** (split tunnel), cross-origin API calls are no longer intercepted, so a failed `fetch` is not replaced by a fake `{ "error": "Offline" }` response. In **`npm run dev`**, service worker registration is **disabled** and existing registrations are **unregistered** on load so local tunnel dev is not broken by a stale worker. After upgrading, do a **hard refresh** or clear site data once if an old worker still controls the tab.

**Gmail SMTP:** Enable 2-Step Verification, create an [App Password](https://myaccount.google.com/apppasswords), and set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` in `.env`.

---

## API overview

Base path: **`/api/v1/`**

| Area | Examples |
|------|----------|
| Health | `GET .../health/` |
| Users | `.../users/login/`, `logout/`, `me/`, `csrf/` |
| Assets | `.../assets/`, `.../assets/guid/<uuid>/`, `.../assets/export/` |
| Customers | `.../customers/`, `.../customers/countries/` |
| Borrowing | `.../borrowing/create/`, `.../borrowing/<id>/return/`, `.../borrowing/asset/<id>/history/` |
| Custom fields | `.../custom-fields/definitions/`, `.../custom-fields/values/<type>/<id>/` |
| QR | `.../qr/templates/`, `.../qr/generate/` |
| Admin logs | `.../notifications/`, `.../audit/` |

**OpenAPI 3:** Authenticated users can open **`/api/docs/`** (Swagger), **`/api/redoc/`** (ReDoc), or **`/api/schema/`** on the API host (same session as the app). See [docs/README.md](docs/README.md).

Detailed routing lives in `backend/*/urls.py`. Conceptual diagrams: [docs/technical.md](docs/technical.md).

---

## Deployment

**Pull backend image from GHCR**

```bash
docker pull ghcr.io/markusbrand/tagly/backend:latest
```

**Compose**

```bash
docker compose -f docker-compose.yml up -d
```

Use strong secrets, disable `DJANGO_DEBUG`, restrict `ALLOWED_HOSTS`, and avoid dev volume mounts in production.

**Rollback**

```bash
docker pull ghcr.io/markusbrand/tagly/backend:<previous-sha>
docker compose up -d
```

**Raspberry Pi 5 (ARM64):** Same Compose flow; image is multi-arch. Prefer SSD and wired Ethernet. Example LAN URLs are in `.env.example` (`HOST_IP`).

---

## Repository layout

```
tagly/
├── backend/           # Django project and apps
├── frontend/          # React (Vite) SPA
├── docs/              # User guide + technical documentation
├── requirements/      # Product requirements and ADR
├── .github/workflows/ # CI + Docker publish to GHCR
├── docker-compose.yml
└── .env.example
```

---

## License

[MIT License](LICENSE)
