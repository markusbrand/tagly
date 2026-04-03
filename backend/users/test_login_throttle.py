import pytest
from django.conf import settings
from django.core.cache import cache
from django.test import override_settings


def _rest_framework_with_login_rate(login_rate: str):
    rf = {**settings.REST_FRAMEWORK}
    rates = {**(rf.get("DEFAULT_THROTTLE_RATES") or {}), "login": login_rate}
    rf["DEFAULT_THROTTLE_RATES"] = rates
    return rf


@pytest.mark.django_db
def test_login_endpoint_throttles_after_burst(api_client):
    """Brute-force mitigation: same client IP gets 429 after exceeding login scope (OWASP A07)."""
    cache.clear()
    rf = _rest_framework_with_login_rate("2/minute")
    with override_settings(REST_FRAMEWORK=rf):
        for _ in range(2):
            r = api_client.post(
                "/api/v1/users/login/",
                {"username": "nouser", "password": "bad"},
                format="json",
            )
            assert r.status_code == 401
        r3 = api_client.post(
            "/api/v1/users/login/",
            {"username": "nouser", "password": "bad"},
            format="json",
        )
        assert r3.status_code == 429
        assert "detail" in r3.data
