from typing import Any

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

security = HTTPBearer()

SUPABASE_JWT_AUDIENCE = "authenticated"
SUPABASE_JWT_ALGORITHMS = ["HS256"]


def decode_access_token(token: str) -> dict[str, Any]:
    """Verify a Supabase access token locally (no Auth API round-trip)."""
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=SUPABASE_JWT_ALGORITHMS,
        audience=SUPABASE_JWT_AUDIENCE,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Verify JWT and return user info from token claims."""
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_metadata = payload.get("user_metadata") or {}
    if not isinstance(user_metadata, dict):
        user_metadata = {}

    return {
        "id": user_id,
        "email": payload.get("email"),
        "display_name": user_metadata.get("display_name"),
    }
