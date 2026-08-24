from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id", "username", "user", "action", "entity_type",
            "entity_id", "old_value", "new_value", "timestamp", "ip_address",
        ]
        read_only_fields = fields
