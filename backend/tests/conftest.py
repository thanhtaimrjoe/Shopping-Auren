"""
Pytest configuration and fixtures for API testing.
"""
import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app

# Set test environment variables
os.environ["TESTING"] = "1"

TEST_USER_ID = "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Bearer token signed with SUPABASE_JWT_SECRET (local auth verification)."""
    token = jwt.encode(
        {
            "sub": TEST_USER_ID,
            "email": "test@example.com",
            "aud": "authenticated",
            "role": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        settings.supabase_jwt_secret,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_meal_data():
    """Sample meal data for testing."""
    return {
        "name": "Test Meal",
        "ingredients": "Ingredient 1\nIngredient 2\nIngredient 3",
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        "name": "Test Product",
        "image_url": "https://example.com/image.jpg",
    }
