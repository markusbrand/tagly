from django.urls import path

from . import views

app_name = "qr_generation"

urlpatterns = [
    path("templates/", views.StickerTemplateListCreateView.as_view(), name="template-list"),
    path("templates/<int:pk>/", views.StickerTemplateDetailView.as_view(), name="template-detail"),
    path("generate/", views.GenerateStickersView.as_view(), name="generate"),
]
