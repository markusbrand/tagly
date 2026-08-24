from django.urls import path

from . import views

app_name = "borrowing"

urlpatterns = [
    path("", views.BorrowListView.as_view(), name="borrow-list"),
    path("create/", views.BorrowCreateView.as_view(), name="borrow-create"),
    path("<int:pk>/", views.BorrowDetailView.as_view(), name="borrow-detail"),
    path("<int:pk>/return/", views.BorrowReturnView.as_view(), name="borrow-return"),
    path("asset/<int:asset_id>/history/", views.AssetBorrowHistoryView.as_view(), name="asset-borrow-history"),
]
