# Tagly — Asset Tracking & Lending Management

Tagly is a web application for tracking hardware, tools, and assets that can be lent to customers. It uses QR-code stickers for asset identification and provides a mobile-first PWA for scanning and a desktop-first backoffice for management.

## Features

- **QR Sticker Generation**: Generate printable PDF sheets of QR-code stickers with configurable templates
- **Mobile QR Scanner (PWA)**: Scan QR codes to onboard assets, lend to customers, or process returns
- **Backoffice Dashboard**: Desktop-first admin interface with asset overview, search/filter, and borrow history
- **Custom Fields**: Admin-configurable metadata fields for assets and customers
- **Offline Support**: Scan and record data offline, sync when connected
- **Notifications**: Automated email alerts for overdue assets
- **Excel Export**: Export filtered asset data to .xlsx
- **Audit Trail**: Complete history of all data changes
- **Multi-language**: English and German (extensible)
- **Light/Dark Mode**: User-selectable theme

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, MUI v6, Vite |
| Backend | Django 5.1, Django REST Framework |
| Database | PostgreSQL 16 |
| Task Queue | Celery + Redis |
| QR Generation | Segno + ReportLab |
| Container | Docker, published to GHCR |
| CI/CD | GitHub Actions |

## Quick Start (Development)

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for frontend development without Docker)
- Python 3.12+ (for backend development without Docker)

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/markusbrand/tagly.git
cd tagly

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Run database migrations
docker compose exec backend python manage.py migrate

# Create a superuser
docker compose exec backend python manage.py createsuperuser

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8008/api/v1/
# Django Admin: http://localhost:8008/admin/
```

### Manual Setup

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
export DB_NAME=tagly DB_USER=tagly DB_PASSWORD=tagly_dev DB_HOST=localhost
export REDIS_URL=redis://localhost:6379/0
export DJANGO_DEBUG=True

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8008
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Celery Workers

```bash
cd backend
celery -A tagly worker -l info
celery -A tagly beat -l info
```

## Configuration

All configuration is via environment variables. See `.env.example` for the full list.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8008` | Backend server port |
| `SERVER_URL` | `https://tagly.brandstaetter.rocks` | Public server URL |
| `DB_NAME` | `tagly` | PostgreSQL database name |
| `DB_USER` | `tagly` | PostgreSQL user |
| `DB_PASSWORD` | - | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `DJANGO_SECRET_KEY` | - | Django secret key (generate for production) |
| `EMAIL_HOST` | `localhost` | SMTP server host |
| `EMAIL_PORT` | `587` | SMTP server port |
| `DEFAULT_FROM_EMAIL` | `noreply@tagly.brandstaetter.rocks` | Sender email address |

### Gmail SMTP Setup

Tagly uses Gmail SMTP for sending overdue-asset notifications. To configure it:

1. **Enable 2-Step Verification** on your Google account at [myaccount.google.com/security](https://myaccount.google.com/security)
2. **Generate an App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — select "Mail" and your device
3. **Set these variables** in your `.env`:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop   # the 16-char App Password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-gmail@gmail.com
```

> **Note:** Never use your regular Gmail password. App Passwords are revocable and scoped to a single application.

## API Overview

Base URL: `/api/v1/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health/` | GET | Health check |
| `/users/login/` | POST | User login |
| `/users/logout/` | POST | User logout |
| `/users/me/` | GET | Current user profile |
| `/assets/` | GET, POST | List/create assets |
| `/assets/<id>/` | GET, PATCH | Asset detail |
| `/assets/guid/<uuid>/` | GET | Lookup asset by GUID |
| `/assets/export/` | GET | Export assets to Excel |
| `/customers/` | GET, POST | List/create customers |
| `/customers/countries/` | GET | Country list |
| `/borrowing/create/` | POST | Create borrow record |
| `/borrowing/<id>/return/` | POST | Return an asset |
| `/borrowing/asset/<id>/history/` | GET | Asset borrow history |
| `/custom-fields/definitions/` | GET, POST | Custom field definitions |
| `/custom-fields/values/<type>/<id>/` | GET, PUT | Custom field values |
| `/qr/templates/` | GET, POST | Sticker templates |
| `/qr/generate/` | POST | Generate QR sticker PDF |
| `/notifications/` | GET | Notification logs (admin) |
| `/audit/` | GET | Audit logs (admin) |

## User Roles

| Role | Capabilities |
|------|-------------|
| **User** | Scan QR codes, onboard/borrow/return assets, view dashboard, search/filter, export to Excel |
| **Admin** | Everything above + configure custom fields, manage sticker templates, delete assets, manage users, view audit/notification logs |

## Deployment (Production)

### Pull from GHCR

```bash
docker pull ghcr.io/markusbrand/tagly/backend:latest
```

### Run with Docker Compose

```bash
docker compose -f docker-compose.yml up -d
```

For production, ensure you set proper environment variables (no `DJANGO_DEBUG`, real `DJANGO_SECRET_KEY`, restrict `ALLOWED_HOSTS`, etc.) and remove dev volume mounts.

### Rollback

```bash
docker pull ghcr.io/markusbrand/tagly/backend:<previous-sha>
docker compose up -d
```

## Deployment on Raspberry Pi 5

Tagly is optimized for running on a Raspberry Pi 5 (ARM64). The Docker image is built for both amd64 and arm64 platforms.

### Setup

```bash
# On your Raspberry Pi 5
git clone https://github.com/markusbrand/tagly.git
cd tagly

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings (Gmail credentials, Django secret key, etc.)

# Start all services
docker compose up -d

# Run migrations and create initial admin user
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

# Access from your network
# Frontend: http://192.168.0.150:5173
# Backend API: http://192.168.0.150:8008/api/v1/
```

### Hardware Recommendations

- **Raspberry Pi 5** with 8GB RAM (recommended) or 4GB (minimum)
- **SSD** via USB 3.0 (strongly recommended over SD card for database performance)
- Wired Ethernet connection for reliable access

## Scaling Notes

Tagly is designed to handle up to 100,000 assets on modest hardware:

- **Database indexes** on commonly filtered fields (status, name, created_at, overdue detection)
- **Constant-memory Excel export** via XlsxWriter for large datasets
- **Paginated API responses** (25 items per page by default)
- **Optimized queries** using Django's select_related/prefetch_related to avoid N+1 patterns

## Project Structure

```
tagly/
├── backend/                 # Django backend
│   ├── tagly/              # Django project (settings, urls, celery)
│   ├── assets/             # Asset management
│   ├── borrowing/          # Borrow/return workflow
│   ├── customers/          # Customer management
│   ├── custom_fields/      # Dynamic field definitions
│   ├── notifications/      # Email notifications
│   ├── qr_generation/      # QR code + PDF generation
│   ├── audit/              # Audit trail
│   ├── users/              # Authentication & roles
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   ├── context/        # React contexts
│   │   ├── i18n/           # Translations
│   │   └── theme/          # MUI theme
│   └── public/
├── .github/workflows/      # CI/CD
├── docker-compose.yml      # Full dev stack
├── .env.example            # Environment template
└── requirements/           # Project documentation
```

## License

This project is licensed under the [MIT License](LICENSE).
