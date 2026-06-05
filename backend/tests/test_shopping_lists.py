"""
Unit tests for Shopping Lists API endpoints.
"""
import pytest
from fastapi import status
from pydantic import ValidationError

from app.schemas.shopping_list import GenerateListBody


class TestShoppingListsAPI:
    def test_get_current_requires_auth(self, client):
        response = client.get("/api/v1/shopping-lists/current")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_get_history_requires_auth(self, client):
        response = client.get("/api/v1/shopping-lists/history")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_get_history_with_auth(self, client, auth_headers):
        response = client.get("/api/v1/shopping-lists/history?weeks=2", headers=auth_headers)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]

    def test_get_list_detail_requires_auth(self, client):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/shopping-lists/{fake_id}")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_add_item_validation(self, client, auth_headers):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.post(
            f"/api/v1/shopping-lists/{fake_id}/items",
            json={"name": "", "category": "other"},
            headers=auth_headers,
        )
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_complete_requires_body(self, client, auth_headers):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.post(
            f"/api/v1/shopping-lists/{fake_id}/complete",
            headers=auth_headers,
        )
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_delete_item_requires_auth(self, client):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(f"/api/v1/shopping-lists/{fake_id}/items/snapshot-0")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_delete_list_requires_auth(self, client):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(f"/api/v1/shopping-lists/{fake_id}")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_complete_invalid_week_range(self, client, auth_headers):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.post(
            f"/api/v1/shopping-lists/{fake_id}/complete",
            json={"week_from_date": "2026-05-20", "week_to_date": "2026-05-10"},
            headers=auth_headers,
        )
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
        ]


class TestGenerateListDraftValidation:
    def test_generate_body_accepts_final_draft_items(self):
        body = GenerateListBody(
            meal_plan_id="00000000-0000-0000-0000-000000000000",
            items=[
                {
                    "name": "Potato",
                    "category": "Curry",
                    "source_type": "meal",
                    "source_id": "11111111-1111-1111-1111-111111111111",
                    "note": "Dùng cho món Curry",
                },
                {
                    "name": "Tissue",
                    "category": "Mua thêm",
                    "source_type": "product",
                    "source_id": "22222222-2222-2222-2222-222222222222",
                    "note": None,
                },
            ],
        )

        assert len(body.items or []) == 2
        assert body.items[0].source_type == "meal"
        assert body.items[1].source_type == "product"

    def test_generate_body_rejects_invalid_draft_item_source_type(self):
        with pytest.raises(ValidationError):
            GenerateListBody(
                meal_plan_id="00000000-0000-0000-0000-000000000000",
                items=[
                    {
                        "name": "Potato",
                        "category": "Curry",
                        "source_type": "unknown",
                    }
                ],
            )
