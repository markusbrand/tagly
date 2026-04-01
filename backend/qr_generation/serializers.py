from rest_framework import serializers

from .models import StickerTemplate


class StickerTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StickerTemplate
        fields = "__all__"

    def validate_rows(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rows must be greater than 0.")
        return value

    def validate_columns(self, value):
        if value <= 0:
            raise serializers.ValidationError("Columns must be greater than 0.")
        return value

    def validate_label_width_mm(self, value):
        if value <= 0:
            raise serializers.ValidationError("Label width must be greater than 0.")
        return value

    def validate_label_height_mm(self, value):
        if value <= 0:
            raise serializers.ValidationError("Label height must be greater than 0.")
        return value

    def validate_h_pitch_mm(self, value):
        if value <= 0:
            raise serializers.ValidationError("Horizontal pitch must be greater than 0.")
        return value

    def validate_v_pitch_mm(self, value):
        if value <= 0:
            raise serializers.ValidationError("Vertical pitch must be greater than 0.")
        return value

    def validate_left_margin_mm(self, value):
        if value < 0:
            raise serializers.ValidationError("Left margin must be non-negative.")
        return value

    def validate_top_margin_mm(self, value):
        if value < 0:
            raise serializers.ValidationError("Top margin must be non-negative.")
        return value


class GenerateStickersSerializer(serializers.Serializer):
    template_id = serializers.IntegerField()
    num_pages = serializers.IntegerField(min_value=1, max_value=50)

    def validate_template_id(self, value):
        if not StickerTemplate.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Template not found.")
        return value
