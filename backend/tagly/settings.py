import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _split_env_list(key: str, default: str) -> list[str]:
    return [x.strip() for x in os.environ.get(key, default).split(",") if x.strip()]


def _env_bool(key: str, default: bool = False) -> bool:
    val = os.environ.get(key)
    if val is None:
        return default
    return val.lower() in ("true", "1", "yes")


SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-me-in-production",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

SERVER_URL = os.environ.get("SERVER_URL", "https://tagly.brandstaetter.rocks")
PORT = int(os.environ.get("PORT", "8008"))

ALLOWED_HOSTS = _split_env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,192.168.0.150")

HOST_IP = os.environ.get("HOST_IP", "192.168.0.150")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    # Local apps
    "users",
    "assets",
    "customers",
    "borrowing",
    "custom_fields",
    "qr_generation",
    "notifications",
    "audit",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "audit.middleware.AuditMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "tagly.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "tagly.wsgi.application"

# Database

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "tagly"),
        "USER": os.environ.get("DB_USER", "tagly"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "600")),
    }
}

# Auth

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization

LANGUAGE_CODE = "en"

LANGUAGES = [
    ("en", "English"),
    ("de", "German"),
]

TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

LOCALE_PATHS = [
    BASE_DIR / "locale",
]

# Static files

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# User-uploaded media (e.g. background images)

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "users.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    # Per-scope rates for ScopedRateThrottle (see users.views.LoginView).
    "DEFAULT_THROTTLE_RATES": {
        "login": os.environ.get("LOGIN_THROTTLE_RATE", "30/minute").strip() or "30/minute",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Tagly API",
    "DESCRIPTION": "REST API for asset tracking, lending, QR stickers, custom fields, and administration.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "SERVE_PERMISSIONS": ["rest_framework.permissions.IsAuthenticated"],
    "SERVE_AUTHENTICATION": ["rest_framework.authentication.SessionAuthentication"],
    "TAGS": [
        {"name": "users", "description": "Authentication, profile, preferences"},
        {"name": "assets", "description": "Asset CRUD, GUID lookup, export"},
        {"name": "customers", "description": "Customers and country list"},
        {"name": "borrowing", "description": "Borrow, return, history"},
        {"name": "custom-fields", "description": "Field definitions and values"},
        {"name": "qr", "description": "Sticker templates and PDF generation"},
        {"name": "notifications", "description": "Notification log (admin)"},
        {"name": "audit", "description": "Audit log (admin)"},
        {"name": "health", "description": "Health check"},
    ],
    "ENUM_NAME_OVERRIDES": {
        "AssetStatusEnum": "assets.models.Asset.Status",
        "BorrowRecordStatusEnum": "borrowing.models.BorrowRecord.Status",
        "NotificationLogStatusEnum": "notifications.models.NotificationLog.Status",
    },
}

# CORS

CORS_ALLOWED_ORIGINS = _split_env_list(
    "CORS_ALLOWED_ORIGINS",
    f"http://localhost:5173,http://127.0.0.1:5173,http://{HOST_IP}:5173,http://{HOST_IP}:8008",
)

CORS_ALLOW_CREDENTIALS = True

# CSRF / Session

CSRF_TRUSTED_ORIGINS = _split_env_list(
    "CSRF_TRUSTED_ORIGINS",
    f"http://localhost:5173,http://127.0.0.1:5173,http://{HOST_IP}:5173,http://{HOST_IP}:8008",
)

CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"

# Cloudflare Tunnel / reverse proxy: TLS ends at edge; Django often sees http://127.0.0.1:8008.
# Without this, request.is_secure() is False, cookies may be wrong, CSRF/origin checks can fail.
_BEHIND_HTTPS_PROXY = _env_bool("DJANGO_BEHIND_HTTPS_PROXY", False)
if _BEHIND_HTTPS_PROXY:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True

SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", _BEHIND_HTTPS_PROXY)
CSRF_COOKIE_SECURE = _env_bool("CSRF_COOKIE_SECURE", _BEHIND_HTTPS_PROXY)

# Redis

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Celery

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# Email

EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@tagly.brandstaetter.rocks")

# Logging

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
