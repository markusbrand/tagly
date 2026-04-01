# Contributing to Tagly

## Development Environment Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (frontend)
- Python 3.12+ (backend)

### Quick Start

```bash
git clone https://github.com/markusbrand/tagly.git
cd tagly
cp .env.example .env

# Start everything via Docker
docker compose up -d

# Or run services manually:

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8008

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Code Style

### Python (Backend)

- **Formatter / Linter:** [Ruff](https://docs.astral.sh/ruff/) — enforced in CI
- Follow PEP 8; Ruff handles formatting automatically
- Run locally: `ruff check backend/ && ruff format backend/`

### TypeScript (Frontend)

- **Linter:** ESLint with the project config
- Run locally: `cd frontend && npm run lint`

### General

- Use meaningful variable and function names
- Keep functions short and focused
- Add logging for error paths (`logger.error(...)` / `console.error(...)`)
- No dead code or commented-out blocks in PRs

## Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run lint
```

## Branch Naming

Use the following prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New functionality | `feature/barcode-support` |
| `fix/` | Bug fix | `fix/overdue-notification-timing` |
| `chore/` | Maintenance, deps, CI | `chore/upgrade-django-5.2` |
| `docs/` | Documentation only | `docs/api-examples` |

Always branch off `main`.

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Keep PRs focused** — one logical change per PR
3. **Write a clear description** — what changed and why
4. **Ensure CI passes** — linting, tests, Docker build
5. **Request review** — at least one approval before merge
6. **Squash merge** into `main`

## Commit Messages

Use conventional-style messages:

```
feat: add barcode scanning support
fix: correct overdue detection timezone handling
chore: bump MUI to v7.4
docs: add Gmail SMTP setup instructions
```

## Reporting Issues

Open a GitHub issue with:

- Steps to reproduce
- Expected vs. actual behavior
- Browser / OS / device info (for frontend issues)
- Relevant log output
