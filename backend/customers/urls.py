from django.urls import path

from .views import CountryListView, CustomerDetailView, CustomerListCreateView

app_name = "customers"

urlpatterns = [
    path("", CustomerListCreateView.as_view(), name="customer-list"),
    path("<int:pk>/", CustomerDetailView.as_view(), name="customer-detail"),
    path("countries/", CountryListView.as_view(), name="country-list"),
]
