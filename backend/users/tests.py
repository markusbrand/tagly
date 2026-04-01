import pytest


@pytest.mark.django_db
class TestUserAPI:
    def test_health_check(self, api_client):
        response = api_client.get('/api/v1/health/')
        assert response.status_code == 200
        assert response.data == {'status': 'ok'}

    def test_csrf_endpoint(self, api_client):
        response = api_client.get('/api/v1/users/csrf/')
        assert response.status_code == 200

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
