import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from borrowing.models import BorrowRecord
from notifications.models import NotificationLog

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def check_overdue_borrows(self):
    """Check for overdue borrow records and send notifications."""
    now = timezone.now()
    overdue_records = list(
        BorrowRecord.objects.filter(
            status=BorrowRecord.Status.ACTIVE,
            borrowed_until__lt=now,
            returned_at__isnull=True,
        ).select_related('asset', 'customer', 'user')
    )

    if not overdue_records:
        logger.info("Overdue check completed. No overdue records found.")
        return

    already_notified_ids = set(
        NotificationLog.objects.filter(
            borrow_record__in=overdue_records,
            notification_type=NotificationLog.NotificationType.OVERDUE,
            status=NotificationLog.Status.SENT,
            sent_at__date=now.date(),
        ).values_list('borrow_record_id', flat=True)
    )

    notified_count = 0
    for record in overdue_records:
        if record.pk in already_notified_ids:
            continue
        _send_overdue_notification(record)
        notified_count += 1

    logger.info(
        "Overdue check completed. %d overdue records, %d newly notified.",
        len(overdue_records), notified_count,
    )


def _send_overdue_notification(record):
    """Send overdue notification emails to user and customer."""
    subject = f"Overdue Asset: {record.asset.name}"

    context = {
        'asset_name': record.asset.name,
        'asset_guid': str(record.asset.guid),
        'customer_name': f"{record.customer.first_name} {record.customer.last_name}",
        'borrowed_from': record.borrowed_from,
        'borrowed_until': record.borrowed_until,
        'days_overdue': (timezone.now() - record.borrowed_until).days,
    }

    message = (
        f"Asset '{context['asset_name']}' (GUID: {context['asset_guid']}) is overdue.\n"
        f"Customer: {context['customer_name']}\n"
        f"Borrowed: {context['borrowed_from']}\n"
        f"Due: {context['borrowed_until']}\n"
        f"Days overdue: {context['days_overdue']}\n"
    )

    if record.user.notification_enabled:
        _send_and_log(subject, message, record, record.user.email)

    if record.customer.email:
        _send_and_log(subject, message, record, record.customer.email)


def _send_and_log(subject, message, record, recipient_email):
    """Send a single email and create the corresponding notification log."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        NotificationLog.objects.create(
            borrow_record=record,
            notification_type=NotificationLog.NotificationType.OVERDUE,
            recipient_email=recipient_email,
            status=NotificationLog.Status.SENT,
        )
        logger.info("Sent overdue notification to %s for asset %s", recipient_email, record.asset.name)
    except Exception as e:
        NotificationLog.objects.create(
            borrow_record=record,
            notification_type=NotificationLog.NotificationType.OVERDUE,
            recipient_email=recipient_email,
            status=NotificationLog.Status.FAILED,
            error_message=str(e),
        )
        logger.error("Failed to send overdue notification to %s: %s", recipient_email, e)
