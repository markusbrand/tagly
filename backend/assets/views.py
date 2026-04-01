import logging

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import filters, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdmin, IsAuthenticated

from .models import Asset
from .serializers import (
    AssetCreateSerializer,
    AssetDetailSerializer,
    AssetListSerializer,
    AssetUpdateSerializer,
)

logger = logging.getLogger(__name__)


class AssetListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AssetCreateSerializer
        return AssetListSerializer

    def get_queryset(self):
        qs = Asset.objects.select_related("created_by")

        include_deleted = self.request.query_params.get("include_deleted", "").lower() == "true"
        if not include_deleted:
            qs = qs.filter(is_deleted=False)

        asset_status = self.request.query_params.get("status")
        if asset_status:
            qs = qs.filter(status=asset_status.upper())

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

    def perform_create(self, serializer):
        asset = serializer.save(created_by=self.request.user)
        logger.info("User %s created asset %s (guid=%s)", self.request.user.username, asset.name, asset.guid)


class AssetDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Asset.objects.select_related("created_by").prefetch_related(
        "borrow_records__customer",
    )

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AssetUpdateSerializer
        return AssetDetailSerializer


class AssetByGuidView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AssetDetailSerializer
    lookup_field = "guid"
    queryset = Asset.objects.select_related("created_by").prefetch_related(
        "borrow_records__customer",
    )


class AssetDeleteView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk)
        except Asset.DoesNotExist:
            return Response({"detail": "Asset not found."}, status=status.HTTP_404_NOT_FOUND)

        delete_reason = request.data.get("delete_reason", "")
        if not delete_reason:
            return Response(
                {"detail": "delete_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        asset.is_deleted = True
        asset.status = Asset.Status.DELETED
        asset.delete_reason = delete_reason
        asset.save(update_fields=["is_deleted", "status", "delete_reason"])

        logger.info(
            "Admin %s soft-deleted asset %s (pk=%s, reason=%s)",
            request.user.username, asset.name, pk, delete_reason,
        )
        return Response({"detail": "Asset deleted."}, status=status.HTTP_200_OK)


class AssetExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Asset.objects.select_related('created_by')

        include_deleted = request.query_params.get('include_deleted', '').lower() == 'true'
        if not include_deleted:
            qs = qs.filter(is_deleted=False)

        asset_status = request.query_params.get('status')
        if asset_status:
            qs = qs.filter(status=asset_status.upper())

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)

        from .export import export_assets_to_xlsx

        buffer = export_assets_to_xlsx(qs)
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="tagly_assets_{timestamp}.xlsx"'
        return response
