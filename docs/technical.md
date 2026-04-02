# Tagly — Technical documentation

**Audience:** engineers, operators, and reviewers. **As-built** from the repository; for installation steps see the [README](../README.md). For product-level ADR narrative, see [requirements/architecture.md](../requirements/architecture.md).

---

## 1. System context

```mermaid
flowchart TB
  subgraph clients [Clients]
    B[Browser / PWA]
  end
  subgraph tagly [Tagly stack]
    FE[React SPA — Vite]
    API[Django + DRF — Gunicorn or runserver]
    W[Celery worker]
    BT[Celery beat]
  end
  DB[(PostgreSQL)]
  R[(Redis)]
  SMTP[[SMTP server]]
  B --> FE
  FE -->|REST JSON + session cookie| API
  API --> DB
  W --> DB
  W --> R
  BT --> R
  W --> SMTP
```

---

## 2. Container / runtime (development Compose)

```mermaid
flowchart LR
  subgraph compose [docker-compose.yml]
    FE[node:20 — npm run dev :5173]
    BE[backend image — Django :8008]
    CW[celery_worker]
    CB[celery_beat]
    PG[(postgres:16)]
    RD[(redis:7)]
  end
  FE -->|VITE_API_URL| BE
  BE --> PG
  BE --> RD
  CW --> PG
  CW --> RD
  CB --> RD
```

| Service | Role |
|---------|------|
| `frontend` | Vite dev server; `VITE_API_URL` points at the API base (must be reachable from the browser). |
| `backend` | Django ASGI/WSGI app; REST API under `/api/v1/`. |
| `celery_worker` | Async tasks (e.g. notifications). |
| `celery_beat` | Periodic schedule (`notifications.tasks.check_overdue_borrows` hourly). |
| `db` | PostgreSQL 16. |
| `redis` | Celery broker and result backend. |

---

## 3. Backend application map

```mermaid
flowchart TB
  subgraph django [Django project tagly]
    URL[tagly/urls.py]
  end
  URL --> users[users]
  URL --> assets[assets]
  URL --> customers[customers]
  URL --> borrowing[borrowing]
  URL --> cf[custom_fields]
  URL --> qr[qr_generation]
  URL --> notif[notifications]
  URL --> audit[audit]
  users --> ORM[(PostgreSQL)]
  assets --> ORM
  customers --> ORM
  borrowing --> ORM
  cf --> ORM
  qr --> ORM
  notif --> ORM
  audit --> ORM
```

### API mount points

| Prefix | App |
|--------|-----|
| `/api/v1/health/` | Health check |
| `/api/v1/users/` | Auth, CSRF, profile, preferences, user admin |
| `/api/v1/assets/` | Assets CRUD, GUID lookup, export, delete |
| `/api/v1/customers/` | Customers, countries |
| `/api/v1/borrowing/` | List, create, detail, return, asset history |
| `/api/v1/custom-fields/` | Definitions + values by entity |
| `/api/v1/qr/` | Sticker templates, PDF generation |
| `/api/v1/notifications/` | Notification log (admin) |
| `/api/v1/audit/` | Audit log (admin) |

---

## 4. Domain model (ORM class diagram)

```mermaid
classDiagram
  class User {
    +Role role
    +Language language
    +Theme theme_preference
    +bool notification_enabled
  }
  class Asset {
    +UUID guid
    +string name
    +Status status
    +bool is_deleted
    +DeleteReason delete_reason
  }
  class Customer {
    +string first_name
    +string last_name
    +string country
    +string email
  }
  class BorrowRecord {
    +Status status
    +datetime borrowed_from
    +datetime borrowed_until
    +datetime returned_at
    +string notes
  }
  class CustomFieldDefinition {
    +EntityType entity_type
    +FieldType field_type
    +JSON options
    +JSON validation_rules
  }
  class CustomFieldValue {
    +JSON value
    +FK content_type
    +int object_id
  }
  class StickerTemplate {
    +float label dimensions / pitch / margins
    +int rows columns
    +bool is_default
  }
  class AuditLog {
    +Action action
    +string entity_type
    +int entity_id
    +JSON old_value
    +JSON new_value
  }
  class NotificationLog {
    +NotificationType notification_type
    +Status status
    +string recipient_email
  }
  note for User "Django AbstractUser subclass"
  Asset "1" --> "1" User : created_by
  BorrowRecord "n" --> "1" Asset
  BorrowRecord "n" --> "1" Customer
  BorrowRecord "n" --> "1" User
  BorrowRecord "1" --> "*" NotificationLog
  CustomFieldDefinition "1" --> "*" CustomFieldValue
  CustomFieldValue ..> Asset : GenericFK
  CustomFieldValue ..> Customer : GenericFK
```

**Enums (representative):**

- `Asset.Status`: `AVAILABLE`, `BORROWED`, `DELETED`
- `BorrowRecord.Status`: `ACTIVE`, `RETURNED`
- `User.Role`: `USER`, `ADMIN`
- `CustomFieldDefinition.FieldType`: `DATE`, `STRING`, `NUMBER`, `DECIMAL`, `SINGLE_SELECT`, `MULTI_SELECT`

**Soft delete:** Assets use `is_deleted` and optional `delete_reason` rather than hard removal in normal operation.

---

## 5. Process diagrams

### 5.1 Borrow and return (happy path)

```mermaid
sequenceDiagram
  participant U as Client SPA
  participant API as Django REST
  participant DB as PostgreSQL
  U->>API: POST /api/v1/borrowing/create/ (asset, customer, dates)
  API->>DB: INSERT BorrowRecord ACTIVE
  API->>DB: UPDATE Asset status BORROWED
  API-->>U: 201 Created
  U->>API: POST /api/v1/borrowing/{id}/return/
  API->>DB: PATCH BorrowRecord RETURNED, returned_at
  API->>DB: UPDATE Asset status AVAILABLE
  API-->>U: 200 OK
```

### 5.2 Asset identification by QR (conceptual)

```mermaid
flowchart TD
  Q[QR encodes asset GUID or URL] --> S[Scanner resolves asset]
  S --> G{GET asset by guid}
  G -->|404 / new| O[Onboarding flow]
  G -->|200 AVAILABLE| B[Borrow flow]
  G -->|200 BORROWED| R[Return flow]
```

### 5.3 Overdue notifications (scheduled)

```mermaid
flowchart LR
  BT[Celery beat — hourly] --> T[check_overdue_borrows]
  T --> DB[(Find ACTIVE borrows past due)]
  T --> SMTP[Send email]
  T --> NL[Write NotificationLog]
```

Schedule is defined in `backend/tagly/celery.py` (`crontab(minute=0)`).

### 5.4 Request path — session auth

```mermaid
sequenceDiagram
  participant B as Browser
  participant API as Django
  B->>API: GET /api/v1/users/csrf/
  API-->>B: Set-Cookie csrftoken
  B->>API: POST /api/v1/users/login/ + X-CSRFToken
  API-->>B: sessionid cookie
  B->>API: API calls with credentials include
```

---

## 6. Frontend structure

```mermaid
flowchart TB
  subgraph app [src/App.tsx routes]
    Login[Login]
    Shell[AppShell]
    Dash[Dashboard]
    Ast[Assets / AssetDetail]
    Scan[Scanner / Onboard / Borrow / Return]
    QR[QRGenerate]
    Adm[AdminLayout]
  end
  subgraph svc [services/*.ts]
    api[api.ts axios]
    auth[auth users]
    astApi[assets borrowing customers]
    cf[customFields]
    off[offlineStore scanner]
  end
  Shell --> Dash
  Shell --> Ast
  Shell --> Scan
  Shell --> QR
  Shell --> Adm
  Scan --> off
  Shell --> api
```

**Stack:** React 19, TypeScript, Vite 8, MUI 7, React Router 7, i18next, Axios, `idb` for offline queue, `html5-qrcode` for scanning.

---

## 7. CI/CD

```mermaid
flowchart TB
  subgraph ci [CI — push / PR to main]
    B1[ruff + pytest — backend]
    B2[eslint + vitest + build — frontend]
  end
  subgraph publish [Docker Publish — push to main]
    D[buildx linux/amd64 + arm64]
    GHCR[ghcr.io/.../backend:latest + :sha]
  end
  ci --> merge[Merge]
  merge --> publish
```

- **CI:** `.github/workflows/ci.yml` — Postgres + Redis services for Django tests.
- **Images:** `.github/workflows/docker-publish.yml` — backend image only to GHCR; frontend is typically built/served per environment (Compose uses Node container for dev).

---

## 8. Security summary

| Topic | Implementation |
|-------|----------------|
| Authentication | Django sessions; login/logout API |
| CSRF | Cookie + `X-CSRFToken` on mutating requests |
| Authorization | DRF permissions; `ADMIN` for sensitive endpoints |
| CORS / CSRF origins | `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` env |
| HTTPS behind proxy | `DJANGO_BEHIND_HTTPS_PROXY` for secure cookies / scheme |
| Secrets | Environment variables only (see `.env.example`) |
| Audit | `AuditLog` on mutations |
| OpenAPI UI | `/api/docs/` and `/api/schema/` require **IsAuthenticated** (session); avoids anonymous enumeration of the surface in production |

---

## 9. OpenAPI schema

```mermaid
flowchart LR
  DEV[Developer browser] -->|session cookie| SW[GET /api/docs/]
  SW --> SCH[GET /api/schema/]
  SCH --> SPEC[OpenAPI 3 YAML/JSON]
  CI[GitHub Actions] --> VAL[spectacular --validate --fail-on-warn]
```

- **Generator:** `drf_spectacular` (`DEFAULT_SCHEMA_CLASS` in DRF settings).
- **Tags:** Grouped by area (users, assets, customers, borrowing, custom-fields, qr, notifications, audit, health).
- **Binary responses:** Asset Excel export and QR PDF generation are documented as binary media types in the schema.

---

## 10. Operational notes

- **Scaling / data volume:** Designed for large asset counts with indexes, pagination, and streaming-style Excel export (see README scaling notes).
- **Production Compose:** Prefer a production WSGI server (e.g. Gunicorn) and a static build of the frontend behind nginx or a CDN—not the dev Vite server.
- **Raspberry Pi / ARM:** Images are multi-arch for `linux/arm64`.

---

## 11. Related files (source of truth)

| Concern | Location |
|---------|----------|
| URL routing | `backend/tagly/urls.py`, `backend/*/urls.py` |
| OpenAPI / Spectacular | `drf_spectacular` in `INSTALLED_APPS`, `SPECTACULAR_SETTINGS` in `backend/tagly/settings.py`, schema routes in `tagly/urls.py` |
| Models | `backend/*/models.py` |
| Celery | `backend/tagly/celery.py`, `backend/*/tasks.py` |
| Frontend routes | `frontend/src/App.tsx` |
| API client config | `frontend/src/services/api.ts` |
| Compose topology | `docker-compose.yml` |
| Env template | `.env.example` |
