from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("borrow_record", "notification_type", "recipient_email", "status", "sent_at")
    list_filter = ("notification_type", "status")
    search_fields = ("recipient_email",)
    readonly_fields = ("sent_at",)
