import logging

from rest_framework import generics

from users.permissions import IsAdmin

from .models import NotificationLog
from .serializers import NotificationLogSerializer

logger = logging.getLogger(__name__)


class NotificationLogListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = NotificationLogSerializer

    def get_queryset(self):
        qs = NotificationLog.objects.select_related(
            "borrow_record__asset",
            "borrow_record__customer",
        )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        notification_type = self.request.query_params.get("notification_type")
        if notification_type:
            qs = qs.filter(notification_type=notification_type.upper())

        from_date = self.request.query_params.get("from_date")
        if from_date:
            qs = qs.filter(sent_at__date__gte=from_date)

        to_date = self.request.query_params.get("to_date")
        if to_date:
            qs = qs.filter(sent_at__date__lte=to_date)

        return qs
