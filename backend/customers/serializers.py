import re

from rest_framework import serializers

from .models import Customer

try:
    import phonenumbers
    HAS_PHONENUMBERS = True
except ImportError:
    HAS_PHONENUMBERS = False


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id", "first_name", "last_name", "address",
            "postal_code", "city", "country", "phone", "email",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_phone(self, value):
        if not value:
            return value
        if HAS_PHONENUMBERS:
            try:
                parsed = phonenumbers.parse(value, None)
                if not phonenumbers.is_valid_number(parsed):
                    raise serializers.ValidationError("Invalid phone number.")
            except phonenumbers.NumberParseException:
                raise serializers.ValidationError(
                    "Invalid phone number format. Use international format, e.g. +491234567890."
                )
        else:
            if not re.match(r'^\+?[\d\s\-()]{7,}$', value):
                raise serializers.ValidationError("Invalid phone number format.")
        return value

    def validate_email(self, value):
        if not value:
            return value
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', value):
            raise serializers.ValidationError("Invalid email format.")
        return value

    def validate_postal_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Postal code must not be empty.")
        return value


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id", "first_name", "last_name", "address", "postal_code",
            "city", "country", "email", "phone",
        ]
        read_only_fields = fields


class CountryRowSerializer(serializers.Serializer):
    """ISO country option for forms (static list)."""

    code = serializers.CharField()
    name = serializers.CharField()
