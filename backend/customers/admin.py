from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "city", "country", "phone", "email")
    search_fields = ("first_name", "last_name", "email", "city")
    list_filter = ("country",)
