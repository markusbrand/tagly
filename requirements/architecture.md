# Tagly — Architecture Decision Record

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Client (Browser / PWA)                                      │
│  React 19 + TypeScript + MUI v7 + Vite                       │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Scanner  │ │ Backoff. │ │ QR Sticker │ │ Offline/IDB  │  │
│  │ (Mobile) │ │ (Desktop)│ │ Generator  │ │ Sync Queue   │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST / JSON (Session Auth)
┌──────────────────────▼───────────────────────────────────────┐
│  Backend                                                     │
│  Django 5.1 + Django REST Framework                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  8 Django Apps                                         │  │
│  │  assets · borrowing · customers · custom_fields        │  │
│  │  qr_generation · notifications · audit · users         │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────────────────────────────┐  │
│  │ Gunicorn     │  │ Celery Worker + Celery Beat          │  │
│  │ (WSGI)       │  │ (overdue checks, email dispatch)     │  │
│  └──────┬───────┘  └──────────────┬───────────────────────┘  │
└─────────┼─────────────────────────┼──────────────────────────┘
          │                         │
  ┌───────▼───────┐         ┌───────▼───────┐
  │ PostgreSQL 16 │         │  Redis 7      │
  │ (data store)  │         │  (broker +    │
  │               │         │   result backend)│
  └───────────────┘         └───────────────┘
```

## Key Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | Django 5.1 + DRF | Batteries-included ORM, admin, auth, migrations. DRF provides serializers, pagination, and permission classes out of the box. |
| Frontend framework | React 19 + TypeScript | Component-driven UI, strong ecosystem, TypeScript for type safety. |
| UI component library | MUI v7 (Material Design) | Comprehensive, accessible component set with built-in theming (light/dark mode), i18n support, and responsive layouts. |
| Database | PostgreSQL 16 | JSONB support for custom field values, robust indexing, production-proven at scale. |
| Task queue | Celery + Redis | Periodic overdue checks and email dispatch without blocking request threads. Redis doubles as Celery broker and result backend. |
| QR code generation | Segno + ReportLab | Segno produces clean SVG/PNG QR codes. ReportLab renders them onto PDF sticker sheets matching configurable label templates. |
| Offline storage | IndexedDB (via `idb`) | Browser-native key-value store for offline scan queue; survives tab restarts. |
| Internationalization | i18next (frontend), Django i18n (backend) | Mature, well-documented; supports English and German with lazy-loaded translation bundles. |
| Containerization | Docker (multi-arch amd64/arm64) | Single artifact for dev machines and Raspberry Pi 5 deployment. Published to GHCR via GitHub Actions. |

## Data Model Overview

```
User (AbstractUser)
 ├── role: USER | ADMIN
 ├── language: en | de
 └── theme_preference: light | dark

Asset
 ├── guid: UUID (from QR code)
 ├── name, status (AVAILABLE | BORROWED | DELETED)
 ├── created_by → User
 └── custom field values (via GenericForeignKey)

Customer
 ├── first_name, last_name, address, postal_code, city, country, phone, email
 └── custom field values (via GenericForeignKey)

BorrowRecord
 ├── asset → Asset
 ├── customer → Customer
 ├── user → User (who performed the action)
 ├── borrowed_from, borrowed_until, returned_at
 └── status: ACTIVE | RETURNED

CustomFieldDefinition
 ├── entity_type: ASSET | CUSTOMER
 ├── name, field_type (DATE, STRING, NUMBER, DECIMAL, SINGLE_SELECT, MULTI_SELECT)
 ├── is_mandatory, options (JSON), validation_rules (JSON)
 └── display_order

CustomFieldValue
 ├── field_definition → CustomFieldDefinition
 ├── content_type + object_id (GenericForeignKey → Asset or Customer)
 └── value (JSONB)

StickerTemplate
 └── label dimensions, pitch, margins, rows, columns, offsets

AuditLog
 ├── user, action (CREATE | UPDATE | DELETE)
 ├── entity_type, entity_id
 └── old_value / new_value (JSON snapshots)

NotificationLog
 ├── borrow_record → BorrowRecord
 ├── notification_type (OVERDUE | REMINDER | DIGEST)
 └── recipient_email, status (SENT | FAILED), error_message
```

### Key Relationships

- An **Asset** has many **BorrowRecords** (history).
- A **Customer** has many **BorrowRecords**.
- **CustomFieldValues** attach to Assets or Customers via Django's `GenericForeignKey`.
- **AuditLog** entries are written on every CREATE, UPDATE, and DELETE across all entities.
- **NotificationLog** tracks each email attempt per BorrowRecord.

## API Design Principles

| Principle | Implementation |
|-----------|----------------|
| REST conventions | Resource-oriented URLs under `/api/v1/`. Standard HTTP verbs: GET (list/detail), POST (create), PATCH (partial update). |
| Authentication | Session-based with CSRF protection. Login via `/api/v1/users/login/`, session cookie returned. |
| Pagination | Cursor/offset pagination, 25 items per page by default. |
| Error format | Consistent `{ "detail": "..." }` or `{ "field": ["error"] }` for validation errors. |
| Filtering | Query parameters on list endpoints (`?status=BORROWED&search=drill`). |
| Versioning | URL prefix `/api/v1/` — new versions get `/api/v2/` without breaking existing clients. |

## Deployment Architecture

```
Raspberry Pi 5 (ARM64)
├── docker compose up -d
│   ├── backend      (Django + Gunicorn)     :8008
│   ├── celery_worker (Celery worker)
│   ├── celery_beat   (Celery beat scheduler)
│   ├── frontend     (Vite dev / nginx)      :5173
│   ├── db           (PostgreSQL 16)         :5432
│   └── redis        (Redis 7)              :6379
```

- **Image registry:** `ghcr.io/markusbrand/tagly/backend` (multi-arch)
- **CI/CD:** GitHub Actions builds, tests, and pushes on every push to `main`
- **Rollback:** Pull a previous image SHA and restart

## Custom Field Design

Custom fields use a **definition + value** pattern with JSONB storage:

1. **CustomFieldDefinition** — admin creates field metadata (name, type, validation rules, select options) scoped to either `ASSET` or `CUSTOMER`.
2. **CustomFieldValue** — stores the actual value as JSONB, linked to the target entity via Django's `GenericForeignKey` (content_type + object_id).

This avoids schema migrations when admins add/remove fields and keeps the relational model clean while allowing arbitrary metadata per entity.

**Trade-offs:**
- Flexible and admin-configurable without code changes
- JSONB queries are slightly slower than native columns but acceptable for the expected dataset size (≤100k assets)
- Validation is enforced at the application layer (serializer), not at the database level

## Offline-First PWA Strategy

The mobile scanner operates as a Progressive Web App with offline capability:

1. **Service Worker** caches the app shell and static assets for offline launch.
2. **IndexedDB queue** (via the `idb` library) stores scan events (onboard, borrow, return) when the device is offline.
3. **Background sync** replays queued operations when connectivity is restored, in FIFO order.
4. **Conflict handling:** Server timestamps are authoritative. If an asset's state has changed between offline scan and sync, the user is prompted to resolve.

## Security Model

| Layer | Mechanism |
|-------|-----------|
| Authentication | Django session cookies (HttpOnly, Secure in production) |
| CSRF | Django CSRF middleware + token in cookie; frontend reads `csrftoken` and sends `X-CSRFToken` header |
| Authorization | Role-based: `USER` and `ADMIN`. DRF permission classes enforce per-view. Admin-only endpoints: custom field management, user management, audit logs, asset deletion. |
| Input validation | DRF serializers validate all input. Custom field validation rules evaluated at the serializer layer. |
| CORS | Explicit allowlist via `CORS_ALLOWED_ORIGINS` environment variable |
| Secrets | All secrets (DB password, Django secret key, SMTP credentials) injected via environment variables, never committed to source |
| Audit trail | Every data mutation is logged with user, action, old/new values, timestamp, and client IP |
