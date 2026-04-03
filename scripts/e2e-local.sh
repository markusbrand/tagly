#!/usr/bin/env bash
# Run Playwright E2E against a local PostgreSQL + Redis (same DB settings as Django).
# Prerequisites:
#   - backend/.venv with: pip install -r backend/requirements.txt
#   - db + redis up (e.g. docker compose up -d db redis)
#   - DB_* and REDIS_URL in project .env if ports differ from 5432/6379 (see .env.example)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/frontend"

if [[ ! -x "${ROOT}/backend/.venv/bin/python" ]]; then
  echo "e2e-local: expected ${ROOT}/backend/.venv — create it and: pip install -r backend/requirements.txt" >&2
  exit 1
fi

export PATH="${ROOT}/backend/.venv/bin:${PATH}"

# Load project .env without `source` (avoids breakage on non-shell-safe lines).
if [[ -f "${ROOT}/.env" ]]; then
  eval "$(
    "${ROOT}/backend/.venv/bin/python" - "${ROOT}" <<'PY'
import sys, shlex
from pathlib import Path

from dotenv import dotenv_values

root = Path(sys.argv[1])
path = root / ".env"
if not path.is_file():
    sys.exit(0)
for key, val in dotenv_values(path).items():
    if not key or val is None:
        continue
    print(f"export {key}={shlex.quote(str(val))}")
PY
  )"
fi

export DB_NAME="${DB_NAME:-tagly}"
export DB_USER="${DB_USER:-tagly}"
export DB_PASSWORD="${DB_PASSWORD:-tagly_dev}"
export DB_HOST="${DB_HOST:-localhost}"
# Django runs on the host; `.env` often keeps DB_PORT=5432 (in-container) while Compose publishes POSTGRES_HOST_PORT.
if [[ -n "${POSTGRES_HOST_PORT:-}" ]]; then
  if [[ -z "${DB_PORT:-}" || "${DB_PORT}" == "5432" ]]; then
    export DB_PORT="${POSTGRES_HOST_PORT}"
  fi
fi
export DB_PORT="${DB_PORT:-5432}"
# Playwright + runserver + manage.py hooks: release DB connections quickly (avoids Postgres max_connections exhaustion).
export DB_CONN_MAX_AGE="${DB_CONN_MAX_AGE:-0}"

export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
if [[ -n "${REDIS_HOST_PORT:-}" ]]; then
  case "${REDIS_URL}" in
    *localhost:6379*|*127.0.0.1:6379*)
      export REDIS_URL="redis://localhost:${REDIS_HOST_PORT}/0"
      ;;
  esac
fi
export DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-e2e-local-dev-key}"
export DJANGO_DEBUG="${DJANGO_DEBUG:-0}"
export E2E_USERNAME="${E2E_USERNAME:-e2e_user}"
export E2E_PASSWORD="${E2E_PASSWORD:-TaglyE2E_Local_Only_1}"

# Default `test:e2e`; set E2E_NPM_SCRIPT=test:e2e:ui for Playwright UI mode.
NPM_SCRIPT="${E2E_NPM_SCRIPT:-test:e2e}"
exec npm run "$NPM_SCRIPT" -- "$@"
