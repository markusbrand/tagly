import threading

_thread_local = threading.local()


def get_current_user():
    return getattr(_thread_local, 'user', None)


def get_current_ip():
    return getattr(_thread_local, 'ip_address', None)


class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_local.user = request.user if request.user.is_authenticated else None
        _thread_local.ip_address = request.META.get('REMOTE_ADDR')
        response = self.get_response(request)
        return response
