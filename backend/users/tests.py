import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()


@pytest.mark.django_db
class TestEnsureE2EUserCommand:
    def test_idempotent_creates_single_user(self):
        call_command('ensure_e2e_user')
        call_command('ensure_e2e_user')
        assert User.objects.filter(username='e2e_user').count() == 1
        user = User.objects.get(username='e2e_user')
        assert user.check_password('TaglyE2E_Local_Only_1')
        assert user.role == User.Role.ADMIN


@pytest.mark.django_db
class TestUserAPI:
    def test_health_check(self, api_client):
        response = api_client.get('/api/v1/health/')
        assert response.status_code == 200
        assert response.data == {'status': 'ok'}

    def test_csrf_endpoint(self, api_client):
        response = api_client.get('/api/v1/users/csrf/')
        assert response.status_code == 200
        assert response.data.get('csrfToken')

    def test_me_unauthenticated(self, api_client):
        response = api_client.get('/api/v1/users/me/')
        assert response.status_code == 403

    def test_me_authenticated(self, authenticated_client, user):
        response = authenticated_client.get('/api/v1/users/me/')
        assert response.status_code == 200
        assert response.data['username'] == user.username

    def test_user_list_requires_admin(self, authenticated_client):
        response = authenticated_client.get('/api/v1/users/')
        assert response.status_code == 403

    def test_user_list_as_admin(self, admin_client):
        response = admin_client.get('/api/v1/users/')
        assert response.status_code == 200

    def test_admin_patch_user_language(self, admin_client, user):
        response = admin_client.patch(
            f'/api/v1/users/{user.id}/',
            {'language': 'de'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['language'] == 'de'
        user.refresh_from_db()
        assert user.language == 'de'

    def test_admin_create_user_with_language(self, admin_client):
        response = admin_client.post(
            '/api/v1/users/',
            {
                'username': 'languser',
                'email': 'lang@example.com',
                'password': 'securepass123',
                'role': 'USER',
                'language': 'de',
            },
            format='json',
        )
        assert response.status_code == 201
        assert response.data['language'] == 'de'
