from django.contrib import admin

from .models import BorrowRecord


@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ("asset", "customer", "user", "status", "borrowed_from", "borrowed_until", "returned_at")
    list_filter = ("status",)
    search_fields = ("asset__name", "customer__first_name", "customer__last_name")
    readonly_fields = ("created_at",)
