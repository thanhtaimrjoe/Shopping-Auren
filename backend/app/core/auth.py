from typing import Any

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.jwt_verify import decode_access_token

security = HTTPBearer()


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
