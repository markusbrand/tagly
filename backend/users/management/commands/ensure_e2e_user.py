"""Create or update the dedicated Playwright E2E user (idempotent)."""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update the E2E test user (credentials from E2E_USERNAME / E2E_PASSWORD)."

    def handle(self, *args, **options):
        username = os.environ.get("E2E_USERNAME", "e2e_user")
        password = os.environ.get("E2E_PASSWORD", "TaglyE2E_Local_Only_1")
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@e2e.local",
                "role": User.Role.ADMIN,
            },
        )
        user.email = user.email or f"{username}@e2e.local"
        # Admin role required for LC E2E: custom fields admin, QR PDF, notification log API.
        user.role = User.Role.ADMIN
        user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(
            self.style.SUCCESS(
                f"E2E user {username!r} {'created' if created else 'updated'}.",
            ),
        )
