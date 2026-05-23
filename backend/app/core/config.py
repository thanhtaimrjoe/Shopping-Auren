from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    @field_validator("supabase_jwt_secret", mode="before")
    @classmethod
    def strip_jwt_secret(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
