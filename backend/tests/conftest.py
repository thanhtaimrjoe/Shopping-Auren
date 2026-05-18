"""
Pytest configuration and fixtures for API testing.
"""
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Set test environment variables
os.environ["TESTING"] = "1"


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """
    Mock authentication headers.
    Note: In a real test, you would get a valid token from Supabase.
    For now, this is a placeholder.
    """
    return {
        "Authorization": "Bearer test_token_placeholder"
    }


@pytest.fixture
def sample_meal_data():
    """Sample meal data for testing."""
    return {
        "name": "Test Meal",
        "ingredients": "Ingredient 1\nIngredient 2\nIngredient 3",
        "category": "japanese"
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        "name": "Test Product",
        "category": "daily",
        "image_url": "https://example.com/image.jpg"
    }
