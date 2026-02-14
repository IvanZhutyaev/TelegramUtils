from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://growthkit:growthkit@localhost:5432/growthkit"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "growthkit-secret-change-in-production"
    telegram_bot_token: str = ""
    openai_api_key: str = ""
    tgstat_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
