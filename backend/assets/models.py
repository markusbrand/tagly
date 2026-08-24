import uuid

from django.conf import settings
from django.db import models


class Asset(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        BORROWED = "BORROWED", "Borrowed"
        DELETED = "DELETED", "Deleted"

    class DeleteReason(models.TextChoices):
        LOST = "lost", "Lost"
        DAMAGED = "damaged", "Damaged"
        RETIRED = "retired", "Retired"

    guid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delete_reason = models.CharField(
        max_length=20,
        choices=DeleteReason.choices,
        null=True,
        blank=True,
    )
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_assets",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "asset"
        verbose_name_plural = "assets"
        indexes = [
            models.Index(fields=["status"], name="idx_asset_status"),
            models.Index(fields=["is_deleted"], name="idx_asset_is_deleted"),
            models.Index(fields=["name"], name="idx_asset_name"),
            models.Index(fields=["status", "is_deleted"], name="idx_asset_status_deleted"),
            models.Index(fields=["-created_at"], name="idx_asset_created_at"),
        ]

    def __str__(self):
        return f"{self.name} ({self.guid})"
