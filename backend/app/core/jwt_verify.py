"""Verify Supabase access tokens (HS256 legacy secret or ES256/RS256 via JWKS)."""
from functools import lru_cache
from typing import Any

import httpx
from jose import JWTError, jwk, jwt

from app.core.config import settings

SUPABASE_JWT_AUDIENCE = "authenticated"
HS256_ALGORITHM = "HS256"
ASYMMETRIC_ALGORITHMS = ("ES256", "RS256")


def _auth_issuer() -> str:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1"


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict[str, Any]:
    url = f"{_auth_issuer()}/.well-known/jwks.json"
    response = httpx.get(url, timeout=10.0)
    response.raise_for_status()
    return response.json()


def _lookup_jwk(kid: str, *, refresh: bool = False) -> dict[str, Any]:
    if refresh:
        _fetch_jwks.cache_clear()
    jwks = _fetch_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    if not refresh:
        return _lookup_jwk(kid, refresh=True)
    raise JWTError(f"No JWK found for kid={kid}")


def decode_access_token(token: str) -> dict[str, Any]:
    """Verify a Supabase access token (legacy HS256 or asymmetric JWKS)."""
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise

    alg = header.get("alg", HS256_ALGORITHM)

    if alg == HS256_ALGORITHM:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=[HS256_ALGORITHM],
            audience=SUPABASE_JWT_AUDIENCE,
        )

    if alg in ASYMMETRIC_ALGORITHMS:
        kid = header.get("kid")
        if not kid:
            raise JWTError("Missing kid in JWT header")
        signing_key = jwk.construct(_lookup_jwk(kid))
        return jwt.decode(
            token,
            signing_key,
            algorithms=[alg],
            audience=SUPABASE_JWT_AUDIENCE,
            issuer=_auth_issuer(),
        )

    raise JWTError(f"Unsupported JWT algorithm: {alg}")
