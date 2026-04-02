from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import NotificationLog


class NotificationLogSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source="borrow_record.asset.name", read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = NotificationLog
        fields = "__all__"
        read_only_fields = [f.name for f in NotificationLog._meta.get_fields() if hasattr(f, 'name')]

    @extend_schema_field(serializers.CharField())
    def get_customer_name(self, obj):
        customer = obj.borrow_record.customer
        return f"{customer.first_name} {customer.last_name}"
