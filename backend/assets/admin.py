from django.contrib import admin

from .models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("name", "guid", "status", "is_deleted", "created_by", "created_at")
    list_filter = ("status", "is_deleted", "delete_reason")
    search_fields = ("name", "guid")
    readonly_fields = ("guid", "created_at", "updated_at")
