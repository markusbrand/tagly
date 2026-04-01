from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class CustomFieldDefinition(models.Model):
    class EntityType(models.TextChoices):
        ASSET = "ASSET", "Asset"
        CUSTOMER = "CUSTOMER", "Customer"

    class FieldType(models.TextChoices):
        DATE = "DATE", "Date"
        STRING = "STRING", "String"
        NUMBER = "NUMBER", "Number"
        DECIMAL = "DECIMAL", "Decimal"
        SINGLE_SELECT = "SINGLE_SELECT", "Single Select"
        MULTI_SELECT = "MULTI_SELECT", "Multi Select"

    entity_type = models.CharField(max_length=20, choices=EntityType.choices)
    name = models.CharField(max_length=255)
    field_type = models.CharField(max_length=20, choices=FieldType.choices)
    is_mandatory = models.BooleanField(default=False)
    options = models.JSONField(default=dict, blank=True)
    validation_rules = models.JSONField(default=dict, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["entity_type", "display_order", "name"]
        verbose_name = "custom field definition"
        verbose_name_plural = "custom field definitions"

    def __str__(self):
        return f"{self.name} ({self.get_entity_type_display()} / {self.get_field_type_display()})"


class CustomFieldValue(models.Model):
    field_definition = models.ForeignKey(
        CustomFieldDefinition,
        on_delete=models.CASCADE,
        related_name="values",
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    value = models.JSONField()

    class Meta:
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "custom field value"
        verbose_name_plural = "custom field values"

    def __str__(self):
        return f"{self.field_definition.name}: {self.value}"
