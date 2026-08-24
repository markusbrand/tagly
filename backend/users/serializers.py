import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

_HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")


def _validate_hex_color(value: str) -> str:
    if value and not _HEX_COLOR_RE.match(value):
        raise serializers.ValidationError("Must be a valid hex color (e.g. #ff0000).")
    return value


class AppearanceFieldsMixin:
    """Shared validation for color fields used in multiple serializers."""

    def validate_appearance_font_color(self, value: str) -> str:
        return _validate_hex_color(value)

    def validate_appearance_bg_color(self, value: str) -> str:
        return _validate_hex_color(value)


class UserSerializer(AppearanceFieldsMixin, serializers.ModelSerializer):
    appearance_bg_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "is_superuser",
            "language", "theme_preference", "notification_enabled",
            "appearance_font_color", "appearance_bg_color", "appearance_bg_image",
            "appearance_bg_image_transparency",
        ]
        read_only_fields = ["id", "is_superuser"]

    def get_appearance_bg_image(self, obj) -> str:
        if obj.appearance_bg_image:
            return obj.appearance_bg_image.url
        return ""


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "language"]
        read_only_fields = ["id"]
        extra_kwargs = {"language": {"required": False}}

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Admin PATCH: role, language, and account status."""

    class Meta:
        model = User
        fields = ["role", "language", "is_active"]


class UserPreferencesSerializer(AppearanceFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "language", "theme_preference", "notification_enabled",
            "appearance_font_color", "appearance_bg_color",
            "appearance_bg_image_transparency",
        ]

    def validate_appearance_bg_image_transparency(self, value):
        if value is not None and not 0 <= value <= 100:
            raise serializers.ValidationError("Must be between 0 and 100.")
        return value


class BackgroundImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    MAX_SIZE = 5 * 1024 * 1024  # 5 MB
    # MPO = multi-picture JPEG container; many phones report it as JPEG bytes but Pillow uses format "MPO".
    ALLOWED_PILLOW = {"JPEG", "PNG", "WEBP", "MPO"}

    def validate_image(self, value):
        if value.size > self.MAX_SIZE:
            raise serializers.ValidationError("Image must be smaller than 5 MB.")

        # Do not rely on UploadedFile.content_type: Electron/browsers often send "" or
        # application/octet-stream; validate actual image bytes with Pillow.
        try:
            from io import BytesIO

            from PIL import Image

            value.seek(0)
            raw = value.read()
            value.seek(0)
            with Image.open(BytesIO(raw)) as img:
                fmt = (img.format or "").upper()
        except Exception:
            raise serializers.ValidationError(
                "Invalid or unsupported image file. Use JPEG, PNG, or WebP.",
            ) from None

        if fmt not in self.ALLOWED_PILLOW:
            raise serializers.ValidationError(
                f"Unsupported image format ({fmt}). Allowed: JPEG, PNG, WebP, and phone JPEG (MPO).",
            )

        return value
