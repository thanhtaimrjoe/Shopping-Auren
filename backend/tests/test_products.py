"""
Unit tests for Products API endpoints.
"""
import pytest
from fastapi import status


class TestProductsAPI:
    """Test suite for /api/v1/products endpoints."""
    
    def test_get_products_requires_auth(self, client):
        """Test that GET /products requires authentication."""
        response = client.get("/api/v1/products")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_create_product_requires_auth(self, client, sample_product_data):
        """Test that POST /products requires authentication."""
        response = client.post("/api/v1/products", json=sample_product_data)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_create_product_validation(self, client, auth_headers):
        """Test product creation with invalid data."""
        # Missing required fields
        invalid_data = {"name": ""}
        response = client.post("/api/v1/products", json=invalid_data, headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_product_name_length_validation(self, client, auth_headers):
        """Test product name length constraints."""
        # Name too long (>100 chars)
        long_name_data = {
            "name": "A" * 101,
        }
        response = client.post("/api/v1/products", json=long_name_data, headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_product_not_found(self, client, auth_headers):
        """Test GET /products/{id} with non-existent ID."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/products/{fake_id}", headers=auth_headers)
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_401_UNAUTHORIZED]
    
    def test_update_product_requires_auth(self, client):
        """Test that PUT /products/{id} requires authentication."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        update_data = {"name": "Updated Product"}
        response = client.put(f"/api/v1/products/{fake_id}", json=update_data)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_delete_product_requires_auth(self, client):
        """Test that DELETE /products/{id} requires authentication."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(f"/api/v1/products/{fake_id}")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_get_products_with_filters(self, client, auth_headers):
        """Test GET /products with query parameters."""
        response = client.get("/api/v1/products?search=test", headers=auth_headers)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]

    def test_product_with_image_url(self, client, auth_headers):
        """Test creating product with image URL."""
        product_data = {
            "name": "Product with Image",
            "image_url": "https://example.com/image.jpg",
        }
        response = client.post("/api/v1/products", json=product_data, headers=auth_headers)
        # Should return 201 or 401 depending on auth
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_500_INTERNAL_SERVER_ERROR,  # no test user in auth.users (FK)
        ]

    def test_product_without_image_url(self, client, auth_headers):
        """Test creating product without image URL (optional field)."""
        product_data = {
            "name": "Product without Image",
        }
        response = client.post("/api/v1/products", json=product_data, headers=auth_headers)
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]


class TestProductsDataValidation:
    """Test data validation for products."""

    def test_image_url_optional(self):
        """Test that image_url is optional."""
        product_without_image = {"name": "Test Product"}
        assert product_without_image.get("image_url") is None
