from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    CMC_API_KEY: str
    COINGECKO_API_KEY: str | None = None  # Optional: Demo API key (free)

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()