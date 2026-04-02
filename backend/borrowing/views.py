import logging

from django.db import transaction
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from assets.models import Asset
from audit.models import AuditLog
from users.permissions import IsAuthenticated

from .models import BorrowRecord
from .serializers import (
    BorrowHistorySerializer,
    BorrowRecordCreateSerializer,
    BorrowRecordSerializer,
    ReturnSerializer,
)

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@extend_schema(
    tags=["borrowing"],
    request=BorrowRecordCreateSerializer,
    responses={201: BorrowRecordSerializer, 400: OpenApiTypes.OBJECT},
)
class BorrowCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = BorrowRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        asset = Asset.objects.select_for_update().get(pk=data["asset_id"])
        borrow = BorrowRecord.objects.create(
            asset=asset,
            customer_id=data["customer_id"],
            user=request.user,
            borrowed_from=data["borrowed_from"],
            borrowed_until=data.get("borrowed_until"),
            notes=data.get("notes", ""),
        )
        asset.status = Asset.Status.BORROWED
        asset.save(update_fields=["status", "updated_at"])

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.CREATE,
            entity_type="BorrowRecord",
            entity_id=borrow.pk,
            new_value={
                "asset_id": asset.pk,
                "customer_id": data["customer_id"],
                "borrowed_from": str(borrow.borrowed_from),
            },
            ip_address=_get_client_ip(request),
        )

        logger.info(
            "Borrow created: record=%d asset=%d customer=%d user=%s",
            borrow.pk, asset.pk, data["customer_id"], request.user.username,
        )

        output = BorrowRecordSerializer(borrow).data
        return Response(output, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["borrowing"],
    request=ReturnSerializer,
    responses={
        200: BorrowRecordSerializer,
        404: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    },
)
class BorrowReturnView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            borrow = BorrowRecord.objects.select_related("asset", "customer", "user").get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response(
                {"detail": "Borrow record not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if borrow.status == BorrowRecord.Status.RETURNED:
            return Response(
                {"detail": "This borrow record has already been returned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        old_status = borrow.status
        borrow.status = BorrowRecord.Status.RETURNED
        borrow.returned_at = data["returned_at"]
        if "notes" in data and data["notes"]:
            borrow.notes = data["notes"]
        borrow.save(update_fields=["status", "returned_at", "notes"])

        asset = Asset.objects.select_for_update().get(pk=borrow.asset_id)
        asset.status = Asset.Status.AVAILABLE
        asset.save(update_fields=["status", "updated_at"])

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            entity_type="BorrowRecord",
            entity_id=borrow.pk,
            old_value={"status": old_status},
            new_value={
                "status": BorrowRecord.Status.RETURNED,
                "returned_at": str(borrow.returned_at),
            },
            ip_address=_get_client_ip(request),
        )

        logger.info(
            "Borrow returned: record=%d asset=%d user=%s",
            borrow.pk, asset.pk, request.user.username,
        )

        output = BorrowRecordSerializer(borrow).data
        return Response(output)


class BorrowListView(generics.ListAPIView):
    serializer_class = BorrowRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = BorrowRecord.objects.select_related("asset", "customer", "user").all()

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        asset_id = self.request.query_params.get("asset_id")
        if asset_id:
            qs = qs.filter(asset_id=asset_id)

        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        overdue = self.request.query_params.get("overdue")
        if overdue and overdue.lower() in ("true", "1"):
            qs = qs.filter(
                borrowed_until__lt=timezone.now(),
                status=BorrowRecord.Status.ACTIVE,
                returned_at__isnull=True,
            )

        return qs


class BorrowDetailView(generics.RetrieveAPIView):
    serializer_class = BorrowRecordSerializer
    permission_classes = [IsAuthenticated]
    queryset = BorrowRecord.objects.select_related("asset", "customer", "user").all()


class AssetBorrowHistoryView(generics.ListAPIView):
    serializer_class = BorrowHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            BorrowRecord.objects.select_related("asset", "customer", "user")
            .filter(asset_id=self.kwargs["asset_id"])
            .order_by("-created_at")
        )
