"""
Unit tests for Meal suggestions API.
"""
from fastapi import status


class TestMealSuggestionsAPI:
    def test_suggestions_requires_auth(self, client):
        response = client.get("/api/v1/meals/suggestions")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_suggestions_invalid_week_start(self, client, auth_headers):
        response = client.get(
            "/api/v1/meals/suggestions?week_start=2026-05-14",
            headers=auth_headers,
        )
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        ]

    def test_suggestions_limit_validation(self, client, auth_headers):
        response = client.get(
            "/api/v1/meals/suggestions?limit=0",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
