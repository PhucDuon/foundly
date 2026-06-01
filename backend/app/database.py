from supabase import create_client, Client
from app.config import settings

# Service-role client for all server-side DB operations (bypasses RLS safely)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
