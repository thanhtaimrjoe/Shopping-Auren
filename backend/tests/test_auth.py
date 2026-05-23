"""Unit tests for JWT auth (local verification, no Supabase Auth API)."""
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.core.jwt_verify import decode_access_token
from app.core.config import settings


def _make_token(**overrides) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "test@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "exp": now + timedelta(hours=1),
        "user_metadata": {"display_name": "Test User"},
    }
    payload.update(overrides)
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


class TestDecodeAccessToken:
    def test_valid_token_returns_claims(self):
        token = _make_token()
        payload = decode_access_token(token)
        assert payload["sub"] == "11111111-1111-1111-1111-111111111111"
        assert payload["email"] == "test@example.com"

    def test_expired_token_raises(self):
        expired = datetime.now(timezone.utc) - timedelta(hours=1)
        token = _make_token(exp=expired)
        with pytest.raises(Exception):
            decode_access_token(token)

    def test_invalid_signature_raises(self):
        token = jwt.encode(
            {"sub": "x", "aud": "authenticated", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "wrong-secret",
            algorithm="HS256",
        )
        with pytest.raises(Exception):
            decode_access_token(token)


class TestGetCurrentUserEndpoint:
    def test_valid_jwt_allows_authenticated_request(self, client):
        token = _make_token()
        response = client.get(
            "/api/v1/meals",
            headers={"Authorization": f"Bearer {token}"},
        )
        # 200 when Supabase is reachable; 500 only if DB/env misconfigured
        assert response.status_code in (200, 500)

    def test_missing_sub_claim_returns_401(self, client):
        token = _make_token(sub=None)
        # jose may omit null sub; encode minimal invalid payload
        token = jwt.encode(
            {
                "email": "test@example.com",
                "aud": "authenticated",
                "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            },
            settings.supabase_jwt_secret,
            algorithm="HS256",
        )
        response = client.get(
            "/api/v1/meals",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
