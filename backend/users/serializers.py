from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "is_superuser",
            "language", "theme_preference", "notification_enabled",
        ]
        read_only_fields = ["id", "is_superuser"]


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


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["language", "theme_preference", "notification_enabled"]
