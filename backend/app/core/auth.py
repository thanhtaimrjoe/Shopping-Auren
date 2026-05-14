from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Verify JWT token using Supabase Auth API and return user info."""
    token = credentials.credentials

    try:
        # Verify the token with Supabase
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return {
            "id": response.user.id,
            "email": response.user.email,
            "display_name": response.user.user_metadata.get("display_name")
        }

    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
