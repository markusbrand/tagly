"""
Asset API: authenticated users share one inventory namespace (no per-owner isolation).
Tests below document that contract for production-readiness reviews.
"""

import uuid

import pytest

from assets.models import Asset
from custom_fields.models import CustomFieldDefinition


@pytest.mark.django_db
class TestAssetSharedInventoryContract:
    def test_peer_can_get_asset_by_pk(self, authenticated_client, client_as_user_two, user, user_two):
        create = authenticated_client.post("/api/v1/assets/", {"name": "Peer PK Asset"})
        assert create.status_code == 201
        aid = create.data["id"]
        r = client_as_user_two.get(f"/api/v1/assets/{aid}/")
        assert r.status_code == 200
        assert r.data["name"] == "Peer PK Asset"

    def test_peer_can_get_asset_by_guid(self, authenticated_client, client_as_user_two, user, user_two):
        create = authenticated_client.post("/api/v1/assets/", {"name": "Peer GUID Asset"})
        guid = create.data["guid"]
        r = client_as_user_two.get(f"/api/v1/assets/guid/{guid}/")
        assert r.status_code == 200
        assert r.data["name"] == "Peer GUID Asset"

    def test_peer_can_patch_asset_created_by_other(
        self, authenticated_client, client_as_user_two, user, user_two
    ):
        create = authenticated_client.post("/api/v1/assets/", {"name": "Before"})
        aid = create.data["id"]
        r = client_as_user_two.patch(f"/api/v1/assets/{aid}/", {"name": "After"}, format="json")
        assert r.status_code == 200
        assert r.data["name"] == "After"
        assert Asset.objects.get(pk=aid).name == "After"

    def test_peer_sees_others_asset_in_list(self, authenticated_client, client_as_user_two, user, user_two):
        authenticated_client.post("/api/v1/assets/", {"name": "List Me"})
        r = client_as_user_two.get("/api/v1/assets/")
        assert r.status_code == 200
        names = {row["name"] for row in r.data["results"]}
        assert "List Me" in names


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

    def test_create_asset_guid_only_derives_display_name(self, authenticated_client, user):
        """QR onboarding posts `guid` + `custom_fields` without `name`; validate() sets QR-xxxxxxxx."""
        g = str(uuid.uuid4())
        response = authenticated_client.post(
            '/api/v1/assets/',
            {'guid': g},
            format='json',
        )
        assert response.status_code == 201
        assert response.data['guid'] == g
        assert response.data['name'] == f'QR-{g[:8]}'

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

    def test_create_asset_optional_decimal_json_null_ok(self, authenticated_client, user):
        """FE sends JSON null for cleared optional DECIMAL; DRF must accept it (allow_null + skip save)."""
        s = CustomFieldDefinition.objects.create(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
            name='Tag',
            field_type=CustomFieldDefinition.FieldType.STRING,
            is_mandatory=True,
            options={},
            validation_rules={'min_length': 1},
            display_order=0,
        )
        d = CustomFieldDefinition.objects.create(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
            name='Weight',
            field_type=CustomFieldDefinition.FieldType.DECIMAL,
            is_mandatory=False,
            options={},
            validation_rules={},
            display_order=1,
        )
        response = authenticated_client.post(
            '/api/v1/assets/',
            {
                'name': 'Null dec test',
                'custom_fields': {str(s.pk): 'x', str(d.pk): None},
            },
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
