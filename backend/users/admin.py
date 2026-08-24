from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "language", "is_active")
    list_filter = ("role", "language", "is_active", "is_staff")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Tagly Settings", {"fields": ("role", "language", "theme_preference", "notification_enabled")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Tagly Settings", {"fields": ("role", "language", "theme_preference", "notification_enabled")}),
    )
