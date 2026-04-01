import logging

from rest_framework import generics

from users.permissions import IsAdmin

from .models import AuditLog
from .serializers import AuditLogSerializer

logger = logging.getLogger(__name__)


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        qs = AuditLog.objects.select_related("user")

        entity_type = self.request.query_params.get("entity_type")
        if entity_type:
            qs = qs.filter(entity_type=entity_type)

        action = self.request.query_params.get("action")
        if action:
            qs = qs.filter(action=action.upper())

        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)

        entity_id = self.request.query_params.get("entity_id")
        if entity_id:
            qs = qs.filter(entity_id=entity_id)

        from_date = self.request.query_params.get("from_date")
        if from_date:
            qs = qs.filter(timestamp__date__gte=from_date)

        to_date = self.request.query_params.get("to_date")
        if to_date:
            qs = qs.filter(timestamp__date__lte=to_date)

        return qs
