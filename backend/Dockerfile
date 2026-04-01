# .dockerignore should contain:
#   __pycache__/
#   *.pyc
#   .env
#   .git/
#   .venv/
#   *.egg-info/
#   .pytest_cache/
#   .mypy_cache/
#   .ruff_cache/
#   Dockerfile
#   docker-compose.yml

# ---------------------------------------------------------------------------
# Stage 1: builder – install Python dependencies into a virtual-env
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2: runtime – lean production image
# ---------------------------------------------------------------------------
FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1000 appuser && \
    useradd -r -u 1000 -g appuser appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY . .
RUN python manage.py collectstatic --noinput 2>/dev/null || true && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8008

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8008/api/v1/health/')" || exit 1

CMD ["gunicorn", "tagly.wsgi:application", "--bind", "0.0.0.0:8008", "--workers", "2"]
