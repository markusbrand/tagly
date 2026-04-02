from datetime import date, datetime

from rest_framework import serializers

from .models import CustomFieldDefinition


class CustomFieldDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomFieldDefinition
        fields = "__all__"

    def validate(self, attrs):
        entity_type = attrs.get("entity_type", getattr(self.instance, "entity_type", None))
        name = attrs.get("name", getattr(self.instance, "name", None))

        qs = CustomFieldDefinition.objects.filter(entity_type=entity_type, name=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {"name": f"A field with this name already exists for entity type '{entity_type}'."}
            )

        field_type = attrs.get("field_type", getattr(self.instance, "field_type", None))
        if field_type in (
            CustomFieldDefinition.FieldType.SINGLE_SELECT,
            CustomFieldDefinition.FieldType.MULTI_SELECT,
        ):
            options = attrs.get("options", getattr(self.instance, "options", None) or {})
            choices = options.get("choices", [])
            if not isinstance(choices, list) or len(choices) == 0:
                raise serializers.ValidationError(
                    {"options": "options.choices must be a non-empty list for select fields."}
                )

        return attrs


class CustomFieldDefinitionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomFieldDefinition
        fields = [
            "name",
            "entity_type",
            "field_type",
            "is_mandatory",
            "options",
            "validation_rules",
            "display_order",
        ]

    def validate(self, attrs):
        return CustomFieldDefinitionSerializer.validate(self, attrs)


class CustomFieldValueSerializer(serializers.Serializer):
    field_definition = serializers.PrimaryKeyRelatedField(
        queryset=CustomFieldDefinition.objects.all(),
    )
    value = serializers.JSONField(allow_null=True)

    def validate(self, attrs):
        field_def = attrs["field_definition"]
        value = attrs["value"]

        if field_def.is_mandatory and (value is None or value == "" or value == []):
            raise serializers.ValidationError(
                {"value": f"Field '{field_def.name}' is mandatory."}
            )

        if value is not None and value != "" and value != []:
            self._validate_type(field_def, value)

        return attrs

    @staticmethod
    def _validate_type(field_def, value):
        ft = field_def.field_type

        if ft == CustomFieldDefinition.FieldType.STRING:
            if not isinstance(value, str):
                raise serializers.ValidationError({"value": "Expected a string."})

        elif ft == CustomFieldDefinition.FieldType.NUMBER:
            if not isinstance(value, int) or isinstance(value, bool):
                raise serializers.ValidationError({"value": "Expected an integer."})

        elif ft == CustomFieldDefinition.FieldType.DECIMAL:
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                raise serializers.ValidationError({"value": "Expected a number (decimal)."})

        elif ft == CustomFieldDefinition.FieldType.DATE:
            if not isinstance(value, str):
                raise serializers.ValidationError({"value": "Expected an ISO date string."})
            try:
                if "T" in value:
                    datetime.fromisoformat(value)
                else:
                    date.fromisoformat(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError({"value": "Invalid ISO date format."})

        elif ft == CustomFieldDefinition.FieldType.SINGLE_SELECT:
            choices = (field_def.options or {}).get("choices", [])
            if value not in choices:
                raise serializers.ValidationError(
                    {"value": f"'{value}' is not a valid choice. Options: {choices}"}
                )

        elif ft == CustomFieldDefinition.FieldType.MULTI_SELECT:
            choices = (field_def.options or {}).get("choices", [])
            if not isinstance(value, list):
                raise serializers.ValidationError({"value": "Expected a list of choices."})
            invalid = [v for v in value if v not in choices]
            if invalid:
                raise serializers.ValidationError(
                    {"value": f"Invalid choices: {invalid}. Options: {choices}"}
                )


class CustomFieldBulkValueSerializer(serializers.Serializer):
    values = serializers.DictField(child=serializers.JSONField(allow_null=True))

    def validate_values(self, values):
        errors = {}
        for field_def_id, value in values.items():
            try:
                field_def = CustomFieldDefinition.objects.get(pk=int(field_def_id))
            except (CustomFieldDefinition.DoesNotExist, ValueError, TypeError):
                errors[field_def_id] = f"Field definition '{field_def_id}' does not exist."
                continue

            entry_serializer = CustomFieldValueSerializer(
                data={"field_definition": field_def.pk, "value": value}
            )
            if not entry_serializer.is_valid():
                errors[field_def_id] = entry_serializer.errors

        if errors:
            raise serializers.ValidationError(errors)

        return values
