from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    cors_origins: str = 'http://localhost:3000'
    token_minutes: int = 60
    # AI content generation (Milestone 15). Leave the key empty to use the offline fallback generator.
    anthropic_api_key: str = ''
    ai_model: str = 'claude-sonnet-4-5'
    ai_monthly_limit: int = 200          # AI generations per school per calendar month
    login_max_attempts: int = 8          # failed logins per email+IP per window
    login_window_seconds: int = 300
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

settings = Settings()
if len(settings.jwt_secret) < 32:
    raise RuntimeError('JWT_SECRET must contain at least 32 characters')
