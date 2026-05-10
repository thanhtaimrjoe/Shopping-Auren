from supabase import create_client, Client
from app.core.config import settings

# Supabase client with anon key (for user-level access with RLS)
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key
)

# Supabase admin client with service role key (bypasses RLS)
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)
