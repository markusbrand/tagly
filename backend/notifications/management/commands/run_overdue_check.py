"""Run the overdue-borrow Celery task synchronously (E2E, cron substitute, local debug)."""

from django.core.management.base import BaseCommand

from notifications.tasks import check_overdue_borrows


class Command(BaseCommand):
    help = "Execute check_overdue_borrows once (no Celery worker required)."

    def handle(self, *args, **options):
        check_overdue_borrows.apply()
        self.stdout.write(self.style.SUCCESS("check_overdue_borrows completed."))
