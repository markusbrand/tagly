import pytest

from assets.models import Asset


@pytest.mark.django_db
class TestAssetAPI:
    def test_list_assets_unauthenticated(self, api_client):
        response = api_client.get('/api/v1/assets/')
        assert response.status_code == 403

    def test_list_assets_authenticated(self, authenticated_client):
        response = authenticated_client.get('/api/v1/assets/')
        assert response.status_code == 200

    def test_create_asset(self, authenticated_client, user):
        response = authenticated_client.post('/api/v1/assets/', {
            'name': 'Test Asset',
        })
        assert response.status_code == 201
        assert response.data['name'] == 'Test Asset'
        assert 'guid' in response.data

    def test_get_asset_by_guid(self, authenticated_client, user):
        create_response = authenticated_client.post('/api/v1/assets/', {
            'name': 'GUID Test Asset',
        })
        guid = create_response.data['guid']

        response = authenticated_client.get(f'/api/v1/assets/guid/{guid}/')
        assert response.status_code == 200
        assert response.data['name'] == 'GUID Test Asset'

    def test_soft_delete_requires_admin(self, authenticated_client, user):
        create_response = authenticated_client.post('/api/v1/assets/', {
            'name': 'Delete Test',
        })
        asset_id = create_response.data['id']

        response = authenticated_client.post(f'/api/v1/assets/{asset_id}/delete/', {
            'delete_reason': 'lost',
        })
        assert response.status_code == 403

    def test_soft_delete_as_admin(self, admin_client):
        create_response = admin_client.post('/api/v1/assets/', {
            'name': 'Delete Test',
        })
        asset_id = create_response.data['id']

        response = admin_client.post(f'/api/v1/assets/{asset_id}/delete/', {
            'delete_reason': 'lost',
        })
        assert response.status_code == 200

        asset = Asset.objects.get(pk=asset_id)
        assert asset.is_deleted is True
        assert asset.delete_reason == 'lost'
        assert asset.status == Asset.Status.DELETED
