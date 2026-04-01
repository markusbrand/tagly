# Tagly — Technology Research Findings

**Owner**: C-3PO (Research) | **Date**: 2026-04-02

---

## Decisions Made (based on research)

| Area | Decision | Alternatives Considered | Rationale |
|------|----------|------------------------|-----------|
| Backend framework | Django + DRF | FastAPI | CRUD-heavy app benefits from Django Admin, built-in auth, mature ORM migrations |
| Database | PostgreSQL | SQLite, MySQL | JSONB support for custom fields with GIN indexes, industry standard |
| Task queue | Celery + Beat + Redis | APScheduler, Huey | Production-grade, horizontal scaling, retry logic, battle-tested |
| QR generation | Segno + ReportLab | qrcode + Pillow | Segno: lighter, more output formats. ReportLab: precise PDF grid control |
| Frontend | React + TypeScript + MUI v6 | Angular, Vue | Material Design 3 theming, React ecosystem per project constraints |
| QR scanning | html5-qrcode (behind abstraction) | jsQR, @zxing/library | Turnkey camera+decode; abstraction allows future swap |
| Offline/PWA | Service Worker + IndexedDB + manual sync | Background Sync API | iOS lacks Background Sync; manual retry is more reliable |
| i18n (frontend) | react-i18next | FormatJS, Lingui | Mature, hooks-based, lazy-loadable namespaces |
| Validation | google-i18n-address + phonenumbers | pypostal | Country-aware postal validation without native C deps |
| Excel export | XlsxWriter | openpyxl | Faster writes, constant-memory mode for large exports |
| Auth | Django session cookies (HttpOnly, Secure) | JWT in localStorage | Better XSS protection for browser-based SPA |

---

## Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS PWA: no Background Sync | Offline borrows may not auto-sync | Explicit retry-when-online + visible sync indicator |
| iOS PWA: storage eviction after ~7 days unused | Cached data lost | Design for re-sync, not permanent local truth |
| html5-qrcode maintenance mode | Security/bug fixes may slow | Abstraction layer allows swap to jsQR or qr-scanner |
| QR sticker misalignment on printers | Labels don't match sticker sheets | X/Y offset calibration setting + high error correction |
| JSONB custom fields: schema discipline | Inconsistent data if app logic has bugs | Field metadata table + app-layer validation (Pydantic/DRF serializers) |

---

## Comparable Products Reviewed

| Product | Relevant Features | URL |
|---------|-------------------|-----|
| Shelf.nu | QR codes, custody/checkout, locations, booking (OSS, AGPL) | shelf.nu |
| Louez | Reservations, contracts for lending (OSS, Next.js) | github.com/Synapsr/Louez |
| LendItems | Barcode lending, notifications, calendars, custom fields | lenditems.com |
| Lend Engine | Asset tracking, lending workflow, member management | lend-engine.com |

### Features to consider for future Tagly versions
- Reservations / advance booking
- Maintenance due dates and service history
- Multi-site / warehouse management
- Email daily digest for admins
- Label print wizard with live preview
