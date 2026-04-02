from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from users.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api/v1/health/", HealthCheckView.as_view(), name="health"),
    path("api/v1/users/", include("users.urls", namespace="users")),
    path("api/v1/assets/", include("assets.urls", namespace="assets")),
    path("api/v1/customers/", include("customers.urls", namespace="customers")),
    path("api/v1/borrowing/", include("borrowing.urls", namespace="borrowing")),
    path("api/v1/custom-fields/", include("custom_fields.urls", namespace="custom_fields")),
    path("api/v1/qr/", include("qr_generation.urls", namespace="qr_generation")),
    path("api/v1/notifications/", include("notifications.urls", namespace="notifications")),
    path("api/v1/audit/", include("audit.urls", namespace="audit")),
]
