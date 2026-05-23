"""
Unit tests for Meal Plans API endpoints.
"""
from fastapi import status


class TestMealPlansAPI:
    def test_get_current_requires_auth(self, client):
        response = client.get("/api/v1/meal-plans/current")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_create_plan_requires_auth(self, client):
        response = client.post(
            "/api/v1/meal-plans",
            json={"meals": []},
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
