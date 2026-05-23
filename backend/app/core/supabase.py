from supabase import Client, ClientOptions, create_client

from app.core.config import settings

_client_options = ClientOptions(
    postgrest_client_timeout=15,
    storage_client_timeout=15,
    function_client_timeout=15,
)

# Supabase client with anon key (reserved for user-scoped flows if needed)
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key,
    options=_client_options,
)

# Service role client for backend API (bypasses RLS; auth enforced in FastAPI)
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
    options=_client_options,
)
