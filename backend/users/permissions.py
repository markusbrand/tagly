from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not u.is_authenticated:
            return False
        # App role and Django superuser must both grant admin (createsuperuser used to leave role=USER).
        return u.role == "ADMIN" or u.is_superuser


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
