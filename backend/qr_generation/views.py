import logging

from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdmin, IsAuthenticated

from .models import StickerTemplate
from .serializers import GenerateStickersSerializer, StickerTemplateSerializer
from .services import generate_sticker_pdf

logger = logging.getLogger(__name__)

_FILENAME_UNSAFE = '<>:"/\\|?*'


def _sticker_pdf_filename(template_name: str) -> str:
    """First 10 characters of template name, sanitized for use in a download filename."""
    prefix = template_name[:10]
    prefix = "".join("_" if c in _FILENAME_UNSAFE else c for c in prefix).strip()
    if not prefix:
        prefix = "template"
    return f"tagly_stickers_{prefix}.pdf"


class StickerTemplateListCreateView(generics.ListCreateAPIView):
    queryset = StickerTemplate.objects.all()
    serializer_class = StickerTemplateSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return []

    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default"):
            StickerTemplate.objects.filter(is_default=True).update(is_default=False)
        template = serializer.save()
        logger.info("Created sticker template '%s' (pk=%s)", template.name, template.pk)


class StickerTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StickerTemplate.objects.all()
    serializer_class = StickerTemplateSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAdmin()]
        return []

    def perform_update(self, serializer):
        if serializer.validated_data.get("is_default"):
            StickerTemplate.objects.filter(is_default=True).exclude(pk=self.get_object().pk).update(is_default=False)
        serializer.save()

    def perform_destroy(self, instance):
        logger.info("Deleted sticker template '%s' (pk=%s)", instance.name, instance.pk)
        instance.delete()


class GenerateStickersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateStickersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        template = StickerTemplate.objects.get(pk=serializer.validated_data["template_id"])
        num_pages = serializer.validated_data["num_pages"]

        buffer, guids = generate_sticker_pdf(template, num_pages)

        logger.info(
            "User %s generated %d QR stickers (%d pages) using template '%s'",
            request.user.username, len(guids), num_pages, template.name,
        )

        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{_sticker_pdf_filename(template.name)}"'
        return response
