"""
Unit tests for Meal Plans API endpoints.
"""
from fastapi import status


class TestMealPlansAPI:
    def test_get_current_requires_auth(self, client):
        response = client.get("/api/v1/meal-plans/current")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_get_current_invalid_week_start(self, client, auth_headers):
        response = client.get(
            "/api/v1/meal-plans/current?week_start=2026-05-14",
            headers=auth_headers,
        )
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_create_plan_requires_auth(self, client):
        response = client.post(
            "/api/v1/meal-plans",
            json={"week_start_date": "2026-05-12", "meals": []},
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
