from django.contrib import admin

from .models import StickerTemplate


@admin.register(StickerTemplate)
class StickerTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "columns", "rows", "label_width_mm", "label_height_mm", "is_default")
    list_filter = ("is_default",)
    search_fields = ("name",)
