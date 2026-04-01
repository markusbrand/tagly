from django.urls import path

from .views import (
    AssetByGuidView,
    AssetDeleteView,
    AssetDetailView,
    AssetExportView,
    AssetListCreateView,
)

app_name = "assets"

urlpatterns = [
    path("", AssetListCreateView.as_view(), name="asset-list"),
    path("export/", AssetExportView.as_view(), name="asset-export"),
    path("<int:pk>/", AssetDetailView.as_view(), name="asset-detail"),
    path("guid/<uuid:guid>/", AssetByGuidView.as_view(), name="asset-by-guid"),
    path("<int:pk>/delete/", AssetDeleteView.as_view(), name="asset-delete"),
]
