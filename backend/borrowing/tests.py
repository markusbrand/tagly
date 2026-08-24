"""
Borrowing API access model: any authenticated user may list, inspect, create, and return
borrow records (shared staff / inventory desk). These tests lock that contract so a future
row-level policy change is explicit rather than accidental (IDOR-style regression signal).
"""

import pytest
from django.utils import timezone

from assets.models import Asset
from borrowing.models import BorrowRecord
from customers.models import Customer


def _customer_payload(suffix: str):
    return {
        "first_name": "Pat",
        "last_name": suffix,
        "address": "1 Test St",
        "postal_code": "1010",
        "city": "Vienna",
        "country": "AT",
        "phone": "+43111222333",
        "email": f"pat_{suffix}@example.com",
    }


@pytest.mark.django_db
class TestBorrowingSharedStaffContract:
    def test_peer_can_list_active_borrow_created_by_other_user(
        self, authenticated_client, client_as_user_two, user, user_two
    ):
        cust = Customer.objects.create(**{k: v for k, v in _customer_payload("A").items()})
        asset_resp = authenticated_client.post("/api/v1/assets/", {"name": "Shared Borrow Asset"})
        assert asset_resp.status_code == 201
        asset_id = asset_resp.data["id"]

        borrow_resp = authenticated_client.post(
            "/api/v1/borrowing/create/",
            {"asset_id": asset_id, "customer_id": cust.pk},
            format="json",
        )
        assert borrow_resp.status_code == 201
        borrow_id = borrow_resp.data["id"]

        listed = client_as_user_two.get("/api/v1/borrowing/", {"status": "ACTIVE"})
        assert listed.status_code == 200
        ids = {row["id"] for row in listed.data["results"]}
        assert borrow_id in ids

    def test_peer_can_return_active_borrow_created_by_other_user(
        self, authenticated_client, client_as_user_two, user, user_two
    ):
        cust = Customer.objects.create(**{k: v for k, v in _customer_payload("B").items()})
        asset_resp = authenticated_client.post("/api/v1/assets/", {"name": "Return Shared Asset"})
        assert asset_resp.status_code == 201
        asset_id = asset_resp.data["id"]

        borrow_resp = authenticated_client.post(
            "/api/v1/borrowing/create/",
            {"asset_id": asset_id, "customer_id": cust.pk},
            format="json",
        )
        assert borrow_resp.status_code == 201
        borrow_id = borrow_resp.data["id"]

        ret = client_as_user_two.post(f"/api/v1/borrowing/{borrow_id}/return/", {}, format="json")
        assert ret.status_code == 200
        assert ret.data["status"] == BorrowRecord.Status.RETURNED

        asset = Asset.objects.get(pk=asset_id)
        assert asset.status == Asset.Status.AVAILABLE

    def test_peer_can_read_borrow_detail_and_asset_history(
        self, authenticated_client, client_as_user_two, user, user_two
    ):
        cust = Customer.objects.create(**{k: v for k, v in _customer_payload("C").items()})
        asset_resp = authenticated_client.post("/api/v1/assets/", {"name": "History Asset"})
        assert asset_resp.status_code == 201
        asset_id = asset_resp.data["id"]

        borrow_resp = authenticated_client.post(
            "/api/v1/borrowing/create/",
            {
                "asset_id": asset_id,
                "customer_id": cust.pk,
                "borrowed_from": timezone.now().isoformat(),
            },
            format="json",
        )
        borrow_id = borrow_resp.data["id"]

        detail = client_as_user_two.get(f"/api/v1/borrowing/{borrow_id}/")
        assert detail.status_code == 200
        assert detail.data["id"] == borrow_id

        hist = client_as_user_two.get(f"/api/v1/borrowing/asset/{asset_id}/history/")
        assert hist.status_code == 200
        hist_ids = {row["id"] for row in hist.data["results"]}
        assert borrow_id in hist_ids
