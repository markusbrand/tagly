from django.utils import timezone
from rest_framework import serializers

from assets.models import Asset
from customers.models import Customer

from .models import BorrowRecord


class _NestedCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["first_name", "last_name"]


class _NestedUserSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)


class BorrowRecordSerializer(serializers.ModelSerializer):
    customer = _NestedCustomerSerializer(read_only=True)
    user = _NestedUserSerializer(read_only=True)
    asset_id = serializers.PrimaryKeyRelatedField(
        queryset=Asset.objects.all(), source="asset", write_only=True,
    )
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source="customer", write_only=True,
    )

    class Meta:
        model = BorrowRecord
        fields = "__all__"

    def validate(self, attrs):
        if self.instance is None:
            asset = attrs.get("asset")
            if asset and asset.status == Asset.Status.BORROWED:
                raise serializers.ValidationError(
                    {"asset_id": "This asset is currently borrowed."}
                )
        return attrs


class BorrowRecordCreateSerializer(serializers.Serializer):
    asset_id = serializers.IntegerField()
    customer_id = serializers.IntegerField()
    borrowed_from = serializers.DateTimeField(required=False)
    borrowed_until = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, default="", allow_blank=True)

    def validate_asset_id(self, value):
        try:
            asset = Asset.objects.get(pk=value)
        except Asset.DoesNotExist:
            raise serializers.ValidationError("Asset does not exist.")
        if asset.status != Asset.Status.AVAILABLE:
            raise serializers.ValidationError(
                f"Asset is not available (current status: {asset.status})."
            )
        return value

    def validate_customer_id(self, value):
        if not Customer.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Customer does not exist.")
        return value

    def validate(self, attrs):
        if "borrowed_from" not in attrs:
            attrs["borrowed_from"] = timezone.now()
        return attrs


class ReturnSerializer(serializers.Serializer):
    returned_at = serializers.DateTimeField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if "returned_at" not in attrs:
            attrs["returned_at"] = timezone.now()
        return attrs


class _HistoryAssetSerializer(serializers.Serializer):
    name = serializers.CharField(read_only=True)
    guid = serializers.UUIDField(read_only=True)


class _HistoryCustomerSerializer(serializers.Serializer):
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)


class BorrowHistorySerializer(serializers.ModelSerializer):
    asset = _HistoryAssetSerializer(read_only=True)
    customer = _HistoryCustomerSerializer(read_only=True)
    user = _NestedUserSerializer(read_only=True)

    class Meta:
        model = BorrowRecord
        fields = [
            "id",
            "asset",
            "customer",
            "borrowed_from",
            "borrowed_until",
            "returned_at",
            "status",
            "created_at",
            "user",
            "notes",
        ]
        read_only_fields = fields
