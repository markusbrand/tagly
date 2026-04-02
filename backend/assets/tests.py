import pytest

from assets.models import Asset
from custom_fields.models import CustomFieldDefinition


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

    def test_create_asset_strict_custom_fields_missing_key(self, authenticated_client, user):
        field = CustomFieldDefinition.objects.create(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
            name='Serial',
            field_type=CustomFieldDefinition.FieldType.STRING,
            is_mandatory=False,
            options={},
            validation_rules={},
            display_order=0,
        )
        response = authenticated_client.post('/api/v1/assets/', {'name': 'Strict Test'})
        assert response.status_code == 400
        assert str(field.pk) in response.data['custom_fields']

    def test_create_asset_strict_unknown_field_id(self, authenticated_client, user):
        CustomFieldDefinition.objects.create(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
            name='Serial',
            field_type=CustomFieldDefinition.FieldType.STRING,
            is_mandatory=False,
            options={},
            validation_rules={},
            display_order=0,
        )
        response = authenticated_client.post(
            '/api/v1/assets/',
            {'name': 'X', 'custom_fields': {'999999': 'nope'}},
            format='json',
        )
        assert response.status_code == 400
        assert '999999' in response.data['custom_fields']

    def test_create_asset_strict_ok_with_all_keys(self, authenticated_client, user):
        field = CustomFieldDefinition.objects.create(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
            name='Serial',
            field_type=CustomFieldDefinition.FieldType.STRING,
            is_mandatory=False,
            options={},
            validation_rules={},
            display_order=0,
        )
        response = authenticated_client.post(
            '/api/v1/assets/',
            {'name': 'OK Test', 'custom_fields': {str(field.pk): ''}},
            format='json',
        )
        assert response.status_code == 201

    def test_create_asset_rejects_custom_fields_when_none_configured(self, authenticated_client, user):
        response = authenticated_client.post(
            '/api/v1/assets/',
            {'name': 'Y', 'custom_fields': {'1': 'orphan'}},
            format='json',
        )
        assert response.status_code == 400
        assert '1' in response.data['custom_fields']
