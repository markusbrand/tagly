from django.db import models


class NotificationLog(models.Model):
    class NotificationType(models.TextChoices):
        OVERDUE = "OVERDUE", "Overdue"
        REMINDER = "REMINDER", "Reminder"
        DIGEST = "DIGEST", "Digest"

    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    borrow_record = models.ForeignKey(
        "borrowing.BorrowRecord",
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )
    recipient_email = models.EmailField()
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
    )
    error_message = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-sent_at"]
        verbose_name = "notification log"
        verbose_name_plural = "notification logs"

    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.recipient_email} ({self.get_status_display()})"
