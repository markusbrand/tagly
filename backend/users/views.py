import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdmin, IsAuthenticated
from .serializers import (
    LoginSerializer,
    UserCreateSerializer,
    UserPreferencesSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        if user is None:
            logger.warning(
                "Failed login attempt for username=%s from IP=%s",
                serializer.validated_data["username"],
                request.META.get("REMOTE_ADDR"),
            )
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)
        logger.info("User %s logged in successfully", user.username)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info("User %s logged out", request.user.username)
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserPreferencesView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserPreferencesSerializer
    http_method_names = ["patch"]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info("Admin %s created user %s", self.request.user.username, user.username)


class CsrfTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        from django.middleware.csrf import get_token

        get_token(request)
        return Response({"detail": "CSRF cookie set."})


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"})
