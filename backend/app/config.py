from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    RESEND_API_KEY: str = ""
    ADMIN_EMAIL: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
