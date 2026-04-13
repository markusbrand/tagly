from django.contrib.contenttypes.models import ContentType
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from borrowing.models import BorrowRecord
from custom_fields.models import CustomFieldDefinition, CustomFieldValue
from custom_fields.validators import (
    is_custom_field_value_empty,
    validate_asset_custom_fields_for_asset_create,
)

from .models import Asset


class BorrowRecordSummarySerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = BorrowRecord
        fields = [
            "id", "customer_name", "borrowed_from",
            "borrowed_until", "returned_at", "status",
        ]

    @extend_schema_field(serializers.CharField())
    def get_customer_name(self, obj):
        return str(obj.customer)


class CustomFieldValueSerializer(serializers.Serializer):
    field_id = serializers.IntegerField(source="field_definition_id")
    field_name = serializers.CharField(source="field_definition.name", read_only=True)
    field_type = serializers.CharField(source="field_definition.field_type", read_only=True)
    value = serializers.JSONField()


class CreatedBySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)


class AssetListSerializer(serializers.ModelSerializer):
    created_by = CreatedBySerializer(read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id", "guid", "name", "status",
            "created_at", "updated_at", "is_deleted", "created_by",
        ]
        read_only_fields = fields


class AssetDetailSerializer(serializers.ModelSerializer):
    created_by = CreatedBySerializer(read_only=True)
    borrow_records = BorrowRecordSummarySerializer(many=True, read_only=True)
    custom_field_values = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            "id", "guid", "name", "status",
            "created_at", "updated_at", "is_deleted",
            "delete_reason", "created_by",
            "borrow_records", "custom_field_values",
        ]
        read_only_fields = fields

    @extend_schema_field(CustomFieldValueSerializer(many=True))
    def get_custom_field_values(self, obj):
        ct = ContentType.objects.get_for_model(obj)
        values = CustomFieldValue.objects.filter(
            content_type=ct,
            object_id=obj.pk,
        ).select_related("field_definition")
        return CustomFieldValueSerializer(values, many=True).data


class AssetCreateSerializer(serializers.ModelSerializer):
    custom_fields = serializers.DictField(
        child=serializers.JSONField(allow_null=True),
        required=False,
        write_only=True,
    )
    guid = serializers.UUIDField(required=False)

    class Meta:
        model = Asset
        fields = ["id", "guid", "name", "custom_fields"]
        read_only_fields = ["id"]
        extra_kwargs = {"name": {"required": True, "allow_blank": False}}

    def validate_guid(self, value):
        if value is None:
            return value
        if Asset.objects.filter(guid=value).exists():
            raise serializers.ValidationError("An asset with this GUID already exists.")
        return value

    def validate(self, attrs):
        name = (attrs.get("name") or "").strip()
        if not name:
            raise serializers.ValidationError(
                {
                    "name": (
                        "Enter a display name for this asset. "
                        "It must be chosen explicitly and is not derived from the QR code."
                    ),
                },
            )
        attrs["name"] = name

        cf = attrs.get("custom_fields")
        errs = validate_asset_custom_fields_for_asset_create(cf if cf is not None else {})
        if errs:
            raise serializers.ValidationError({"custom_fields": errs})
        return attrs

    def create(self, validated_data):
        custom_fields_data = validated_data.pop("custom_fields", None) or {}
        guid = validated_data.pop("guid", None)
        create_kwargs = {**validated_data}
        if guid is not None:
            create_kwargs["guid"] = guid
        asset = Asset.objects.create(**create_kwargs)
        self._save_custom_fields(asset, custom_fields_data)
        return asset

    def _save_custom_fields(self, asset, custom_fields_data):
        if not custom_fields_data:
            return
        ct = ContentType.objects.get_for_model(asset)
        for field_id_str, value in custom_fields_data.items():
            try:
                field_def = CustomFieldDefinition.objects.get(
                    pk=int(field_id_str),
                    entity_type=CustomFieldDefinition.EntityType.ASSET,
                )
            except (CustomFieldDefinition.DoesNotExist, ValueError):
                continue
            if is_custom_field_value_empty(value, field_def.field_type):
                continue
            CustomFieldValue.objects.create(
                field_definition=field_def,
                content_type=ct,
                object_id=asset.pk,
                value=value,
            )


class AssetUpdateSerializer(serializers.ModelSerializer):
    custom_fields = serializers.DictField(
        child=serializers.JSONField(allow_null=True),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Asset
        fields = ["id", "guid", "name", "status", "custom_fields"]
        read_only_fields = ["id", "guid"]

    def update(self, instance, validated_data):
        custom_fields_data = validated_data.pop("custom_fields", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if custom_fields_data is not None:
            self._save_custom_fields(instance, custom_fields_data)
        return instance

    def _save_custom_fields(self, asset, custom_fields_data):
        ct = ContentType.objects.get_for_model(asset)
        for field_id_str, value in custom_fields_data.items():
            try:
                field_def = CustomFieldDefinition.objects.get(
                    pk=int(field_id_str),
                    entity_type=CustomFieldDefinition.EntityType.ASSET,
                )
            except (CustomFieldDefinition.DoesNotExist, ValueError):
                continue
            if is_custom_field_value_empty(value, field_def.field_type):
                CustomFieldValue.objects.filter(
                    field_definition=field_def,
                    content_type=ct,
                    object_id=asset.pk,
                ).delete()
                continue
            CustomFieldValue.objects.update_or_create(
                field_definition=field_def,
                content_type=ct,
                object_id=asset.pk,
                defaults={"value": value},
            )
