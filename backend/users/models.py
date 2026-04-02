from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    """Ensures Django superusers get Tagly admin capabilities (role=ADMIN)."""

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", self.model.Role.ADMIN)
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = "USER", "User"
        ADMIN = "ADMIN", "Admin"

    class Language(models.TextChoices):
        EN = "en", "English"
        DE = "de", "German"

    class Theme(models.TextChoices):
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
    )
    language = models.CharField(
        max_length=5,
        choices=Language.choices,
        default=Language.EN,
    )
    theme_preference = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.LIGHT,
    )
    notification_enabled = models.BooleanField(default=True)

    objects = UserManager()

    class Meta:
        ordering = ["username"]
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
