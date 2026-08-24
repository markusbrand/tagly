import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Safely get the real client IP address."""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    remote_addr = request.META.get("REMOTE_ADDR")

    if forwarded:
        from rest_framework.settings import api_settings

        num_proxies = api_settings.NUM_PROXIES
        if num_proxies is not None and num_proxies > 0:
            addrs = forwarded.split(",")
            return addrs[-min(num_proxies, len(addrs))].strip()

    return remote_addr
