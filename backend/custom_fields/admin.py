from django.contrib import admin

from .models import CustomFieldDefinition, CustomFieldValue


@admin.register(CustomFieldDefinition)
class CustomFieldDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "entity_type", "field_type", "is_mandatory", "display_order")
    list_filter = ("entity_type", "field_type", "is_mandatory")
    search_fields = ("name",)


@admin.register(CustomFieldValue)
class CustomFieldValueAdmin(admin.ModelAdmin):
    list_display = ("field_definition", "content_type", "object_id", "value")
    list_filter = ("field_definition__entity_type",)
