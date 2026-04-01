import logging

from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerListSerializer, CustomerSerializer

logger = logging.getLogger(__name__)


class CustomerListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CustomerSerializer
        return CustomerListSerializer

    def get_queryset(self):
        qs = Customer.objects.all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(city__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        customer = serializer.save()
        logger.info("User %s created customer %s", self.request.user.username, customer)


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()


COUNTRIES = [
    {"code": "AT", "name": "Austria"},
    {"code": "AU", "name": "Australia"},
    {"code": "BE", "name": "Belgium"},
    {"code": "BR", "name": "Brazil"},
    {"code": "CA", "name": "Canada"},
    {"code": "CH", "name": "Switzerland"},
    {"code": "CN", "name": "China"},
    {"code": "CZ", "name": "Czech Republic"},
    {"code": "DE", "name": "Germany"},
    {"code": "DK", "name": "Denmark"},
    {"code": "ES", "name": "Spain"},
    {"code": "FI", "name": "Finland"},
    {"code": "FR", "name": "France"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "GR", "name": "Greece"},
    {"code": "HR", "name": "Croatia"},
    {"code": "HU", "name": "Hungary"},
    {"code": "IE", "name": "Ireland"},
    {"code": "IN", "name": "India"},
    {"code": "IT", "name": "Italy"},
    {"code": "JP", "name": "Japan"},
    {"code": "KR", "name": "South Korea"},
    {"code": "LU", "name": "Luxembourg"},
    {"code": "MX", "name": "Mexico"},
    {"code": "NL", "name": "Netherlands"},
    {"code": "NO", "name": "Norway"},
    {"code": "NZ", "name": "New Zealand"},
    {"code": "PL", "name": "Poland"},
    {"code": "PT", "name": "Portugal"},
    {"code": "RO", "name": "Romania"},
    {"code": "SE", "name": "Sweden"},
    {"code": "SI", "name": "Slovenia"},
    {"code": "SK", "name": "Slovakia"},
    {"code": "TR", "name": "Turkey"},
    {"code": "US", "name": "United States"},
]


class CountryListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(COUNTRIES)
