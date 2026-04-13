import re

from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
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

    appearance_font_color = models.CharField(
        max_length=9, blank=True, default="",
        help_text="Hex color for content text, e.g. #1a1a1a",
    )
    appearance_bg_color = models.CharField(
        max_length=9, blank=True, default="",
        help_text="Hex color for content background, e.g. #f5f5f5",
    )
    appearance_bg_image = models.ImageField(
        upload_to="user_backgrounds/", blank=True, default="",
        help_text="Custom background image for the content area.",
    )
    # 0 = image fully opaque; 100 = image fully transparent (background color shows through).
    appearance_bg_image_transparency = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    objects = UserManager()

    class Meta:
        ordering = ["username"]
        verbose_name = "user"
        verbose_name_plural = "users"

    _HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

    def clean(self):
        super().clean()
        for field_name in ("appearance_font_color", "appearance_bg_color"):
            value = getattr(self, field_name, "")
            if value and not self._HEX_COLOR_RE.match(value):
                raise ValidationError({field_name: "Must be a valid hex color (e.g. #ff0000)."})

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
