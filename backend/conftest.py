import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com',
        role='USER',
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='adminuser',
        password='testpass123',
        email='admin@example.com',
        role='ADMIN',
    )


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client
