from django.conf import settings
from django.db import models


class BorrowRecord(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        RETURNED = "RETURNED", "Returned"

    asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.PROTECT,
        related_name="borrow_records",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="borrow_records",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="borrow_records",
    )
    borrowed_from = models.DateTimeField()
    borrowed_until = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "borrow record"
        verbose_name_plural = "borrow records"
        indexes = [
            models.Index(fields=["status"], name="idx_borrow_status"),
            models.Index(fields=["status", "borrowed_until"], name="idx_borrow_overdue"),
            models.Index(fields=["asset", "-created_at"], name="idx_borrow_asset_history"),
        ]

    def __str__(self):
        return f"{self.asset.name} -> {self.customer} ({self.get_status_display()})"
