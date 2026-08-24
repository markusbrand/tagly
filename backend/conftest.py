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
def user_two(db):
    return User.objects.create_user(
        username='testuser2',
        password='testpass123',
        email='testuser2@example.com',
        role='USER',
    )


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def api_client_two():
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


@pytest.fixture
def client_as_user_two(api_client_two, user_two):
    api_client_two.force_authenticate(user=user_two)
    return api_client_two
