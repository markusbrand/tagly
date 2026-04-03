"""
Login throttling reads REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['login'] from Django settings
on each check so tests can override the rate and env/defaults stay in sync (DRF's
ScopedRateThrottle uses a class-level snapshot of api_settings that ignores override_settings).
"""

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class LoginIPThrottle(SimpleRateThrottle):
    """Limit POST /login/ by client IP (unauthenticated requests only on this view)."""

    scope = "login"

    def get_rate(self):
        rates = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES") or {}
        return rates.get("login") or "30/minute"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
