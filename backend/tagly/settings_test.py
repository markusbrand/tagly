from . import settings as _base_settings
from .settings import *  # noqa: F401, F403

# Avoid flaky tests when many login attempts run in one test process.
_rf = dict(_base_settings.REST_FRAMEWORK)
_login_rates = {**(_rf.get("DEFAULT_THROTTLE_RATES") or {}), "login": "10000/minute"}
_rf["DEFAULT_THROTTLE_RATES"] = _login_rates
REST_FRAMEWORK = _rf

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
