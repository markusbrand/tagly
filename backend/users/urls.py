from django.urls import path

from .views import (
    CsrfTokenView,
    LoginView,
    LogoutView,
    MeView,
    UserListView,
    UserPreferencesView,
)

app_name = "users"

urlpatterns = [
    path("csrf/", CsrfTokenView.as_view(), name="csrf-token"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("me/preferences/", UserPreferencesView.as_view(), name="preferences"),
    path("", UserListView.as_view(), name="user-list"),
]
