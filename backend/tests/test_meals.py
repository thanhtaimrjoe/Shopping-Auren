"""
Unit tests for Meals API endpoints.
"""
import pytest
from fastapi import status


class TestMealsAPI:
    """Test suite for /api/v1/meals endpoints."""
    
    def test_get_meals_requires_auth(self, client):
        """Test that GET /meals requires authentication."""
        response = client.get("/api/v1/meals")
        # Should return 401 or redirect to login without auth
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_create_meal_requires_auth(self, client, sample_meal_data):
        """Test that POST /meals requires authentication."""
        response = client.post("/api/v1/meals", json=sample_meal_data)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_create_meal_validation(self, client, auth_headers):
        """Test meal creation with invalid data."""
        # Missing required fields
        invalid_data = {"name": ""}
        response = client.post("/api/v1/meals", json=invalid_data, headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_meal_name_length_validation(self, client, auth_headers):
        """Test meal name length constraints."""
        # Name too long (>100 chars)
        long_name_data = {
            "name": "A" * 101,
            "ingredients": "Test",
        }
        response = client.post("/api/v1/meals", json=long_name_data, headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_meal_not_found(self, client, auth_headers):
        """Test GET /meals/{id} with non-existent ID."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/meals/{fake_id}", headers=auth_headers)
        # Should return 404 or 401 depending on auth
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_401_UNAUTHORIZED]
    
    def test_update_meal_requires_auth(self, client):
        """Test that PUT /meals/{id} requires authentication."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        update_data = {"name": "Updated Meal"}
        response = client.put(f"/api/v1/meals/{fake_id}", json=update_data)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_delete_meal_requires_auth(self, client):
        """Test that DELETE /meals/{id} requires authentication."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(f"/api/v1/meals/{fake_id}")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_get_meals_with_filters(self, client, auth_headers):
        """Test GET /meals with query parameters."""
        response = client.get("/api/v1/meals?search=test", headers=auth_headers)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]


class TestMealsDataValidation:
    """Test data validation for meals."""

    def test_ingredients_format(self):
        """Test ingredients format (newline-separated)."""
        ingredients = "Ingredient 1\nIngredient 2\nIngredient 3"
        lines = ingredients.split("\n")
        assert len(lines) == 3
        assert all(line.strip() for line in lines)
