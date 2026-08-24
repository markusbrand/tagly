from django.conf import settings

def get_client_ip(request):
    """
    Securely get the client IP address.
    Only trusts HTTP_X_FORWARDED_FOR if explicitly configured to do so (via USE_X_FORWARDED_HOST).
    """
    if getattr(settings, "USE_X_FORWARDED_HOST", False):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            # X-Forwarded-For can contain multiple IPs; the first is the original client.
            return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
