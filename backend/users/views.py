import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdmin, IsAuthenticated
from .throttling import LoginIPThrottle
from rest_framework.parsers import FormParser, MultiPartParser

from .serializers import (
    BackgroundImageUploadSerializer,
    LoginSerializer,
    UserAdminUpdateSerializer,
    UserCreateSerializer,
    UserPreferencesSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()

LoginErrorResponse = inline_serializer(
    name="LoginErrorResponse",
    fields={"detail": serializers.CharField()},
)


ThrottledResponse = inline_serializer(
    name="LoginThrottledResponse",
    fields={"detail": serializers.CharField()},
)


@extend_schema(
    tags=["users"],
    request=LoginSerializer,
    responses={200: UserSerializer, 401: LoginErrorResponse, 429: ThrottledResponse},
)
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginIPThrottle]

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
        return Response(UserSerializer(user, context={"request": request}).data)


@extend_schema(tags=["users"], request=None, responses={status.HTTP_204_NO_CONTENT: None})
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


class BackgroundImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(tags=["users"], request=BackgroundImageUploadSerializer, responses={200: UserSerializer})
    def post(self, request):
        if not request.FILES.get("image"):
            logger.warning(
                "Background image POST without file: user=%s FILES=%s content_type=%s",
                request.user.username,
                list(request.FILES.keys()),
                request.content_type,
            )
            return Response(
                {"image": ["No file was submitted. Use multipart field name “image”."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BackgroundImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if user.appearance_bg_image:
            user.appearance_bg_image.delete(save=False)

        user.appearance_bg_image = serializer.validated_data["image"]
        user.save(update_fields=["appearance_bg_image"])
        logger.info("User %s uploaded background image", user.username)
        return Response(UserSerializer(user, context={"request": request}).data)

    @extend_schema(tags=["users"], responses={204: None})
    def delete(self, request):
        user = request.user
        if user.appearance_bg_image:
            user.appearance_bg_image.delete(save=False)
            user.appearance_bg_image = ""
            user.save(update_fields=["appearance_bg_image"])
            logger.info("User %s removed background image", user.username)
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Admin: get or update a user (role, language, is_active)."""

    permission_classes = [IsAdmin]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserAdminUpdateSerializer
        return UserSerializer

    def perform_update(self, serializer):
        serializer.save()
        u = self.get_object()
        logger.info(
            "Admin %s updated user %s (role=%s, language=%s, is_active=%s)",
            self.request.user.username,
            u.username,
            u.role,
            u.language,
            u.is_active,
        )


CsrfResponse = inline_serializer(
    name="CsrfResponse",
    fields={
        "detail": serializers.CharField(),
        "csrfToken": serializers.CharField(),
    },
)


@extend_schema(tags=["users"], responses={200: CsrfResponse})
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        from django.middleware.csrf import get_token

        token = get_token(request)
        # Expose token in JSON so SPA clients on another origin (e.g. Vite :5173 → API :8008)
        # can send X-CSRFToken; document.cookie on the dev server cannot read API cookies.
        return Response({"detail": "CSRF cookie set.", "csrfToken": token})


HealthResponse = inline_serializer(
    name="HealthResponse",
    fields={"status": serializers.CharField()},
)


@extend_schema(tags=["health"], responses={200: HealthResponse})
class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"})
