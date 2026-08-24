from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "entity_type", "entity_id", "timestamp", "ip_address")
    list_filter = ("action", "entity_type")
    search_fields = ("entity_type", "user__username")
    readonly_fields = ("timestamp",)
