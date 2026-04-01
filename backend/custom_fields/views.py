import logging

from django.contrib.contenttypes.models import ContentType
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from assets.models import Asset
from customers.models import Customer
from users.permissions import IsAdmin, IsAuthenticated

from .models import CustomFieldDefinition, CustomFieldValue
from .serializers import (
    CustomFieldBulkValueSerializer,
    CustomFieldDefinitionCreateSerializer,
    CustomFieldDefinitionSerializer,
)

logger = logging.getLogger(__name__)

ENTITY_TYPE_MODEL_MAP = {
    "asset": Asset,
    "customer": Customer,
}


class CustomFieldDefinitionListCreateView(generics.ListCreateAPIView):
    queryset = CustomFieldDefinition.objects.all()

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CustomFieldDefinitionCreateSerializer
        return CustomFieldDefinitionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        entity_type = self.request.query_params.get("entity_type")
        if entity_type:
            qs = qs.filter(entity_type=entity_type.upper())
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        logger.info(
            "Custom field definition created: id=%d name='%s' entity_type=%s by user=%s",
            instance.pk, instance.name, instance.entity_type,
            self.request.user.username,
        )


class CustomFieldDefinitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomFieldDefinition.objects.all()
    serializer_class = CustomFieldDefinitionSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        values_count = CustomFieldValue.objects.filter(field_definition=instance).count()

        logger.warning(
            "Deleting custom field definition id=%d name='%s': %d associated values will be removed. user=%s",
            instance.pk, instance.name, values_count, request.user.username,
        )

        self.perform_destroy(instance)
        return Response(
            {
                "detail": f"Field definition deleted. {values_count} associated value(s) were removed.",
            },
            status=status.HTTP_200_OK,
        )


class CustomFieldValuesView(APIView):
    permission_classes = [IsAuthenticated]

    def _resolve_entity(self, entity_type_str, entity_id):
        model_class = ENTITY_TYPE_MODEL_MAP.get(entity_type_str.lower())
        if model_class is None:
            return None, None, f"Unknown entity type: '{entity_type_str}'. Use 'asset' or 'customer'."

        try:
            entity = model_class.objects.get(pk=entity_id)
        except model_class.DoesNotExist:
            return None, None, f"{model_class.__name__} with id {entity_id} not found."

        ct = ContentType.objects.get_for_model(model_class)
        return entity, ct, None

    def get(self, request, entity_type, entity_id):
        entity, ct, error = self._resolve_entity(entity_type, entity_id)
        if error:
            return Response({"detail": error}, status=status.HTTP_404_NOT_FOUND)

        field_values = CustomFieldValue.objects.filter(
            content_type=ct, object_id=entity.pk,
        ).select_related("field_definition")

        result = {
            str(fv.field_definition_id): fv.value
            for fv in field_values
        }
        return Response(result)

    def put(self, request, entity_type, entity_id):
        entity, ct, error = self._resolve_entity(entity_type, entity_id)
        if error:
            return Response({"detail": error}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomFieldBulkValueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values_dict = serializer.validated_data["values"]

        updated_ids = []
        for field_def_id_str, value in values_dict.items():
            field_def_id = int(field_def_id_str)
            CustomFieldValue.objects.update_or_create(
                field_definition_id=field_def_id,
                content_type=ct,
                object_id=entity.pk,
                defaults={"value": value},
            )
            updated_ids.append(field_def_id)

        logger.info(
            "Custom field values updated: entity_type=%s entity_id=%d fields=%s user=%s",
            entity_type, entity_id, updated_ids, request.user.username,
        )

        field_values = CustomFieldValue.objects.filter(
            content_type=ct, object_id=entity.pk,
        ).select_related("field_definition")

        result = {
            str(fv.field_definition_id): fv.value
            for fv in field_values
        }
        return Response(result)
