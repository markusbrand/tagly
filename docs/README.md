# Tagly documentation

This folder is the **documentation home** for Tagly. Use it to onboard developers, operators, and end users.

| Document | Audience | Contents |
|----------|----------|----------|
| [**User guide**](user-guide.md) | Staff using the app day to day | Roles, scanner and backoffice flows, offline behavior, troubleshooting for users |
| [**Technical documentation**](technical.md) | Developers, DevOps, security reviewers | Architecture, domain model, APIs, deployment, CI/CD, security (with Mermaid diagrams) |
| [Requirements / ADR](../requirements/architecture.md) | Product & engineering | Historical architecture decisions and rationale (kept alongside `requirements/`) |

**Installation** (backend, frontend, Docker, production) lives in the [root README](../README.md) so clone-and-run steps stay in one obvious place.

### Doc maintenance

- Diagrams describe the **as-built** codebase unless labeled *planned*.
- When behavior changes materially, update the relevant section here and the installation notes in `README.md`.

### OpenAPI (machine-readable API)

The backend exposes **OpenAPI 3** from **drf-spectacular** (generated from DRF routes and serializers). **You must be logged in** (session cookie) to fetch the schema or open the UI—same rule as the rest of the authenticated API.

| URL (relative to API host, e.g. `http://localhost:8008`) | Purpose |
|----------------------------------------------------------|---------|
| `/api/schema/` | OpenAPI schema (`?format=openapi-json` for JSON) |
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | ReDoc |

CI runs `python manage.py spectacular --validate --fail-on-warn` so schema regressions fail the build. A separate **E2E** job runs Playwright against the app (see root `README.md` and `docs/technical.md` § CI/CD).
