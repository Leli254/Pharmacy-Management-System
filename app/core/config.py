#  app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr


class Settings(BaseSettings):
    # Pydantic will look for an environment variable named SECRET_KEY
    # SecretStr hides the value when printing to logs
    # Default for local dev
    SECRET_KEY: SecretStr = "+e6k60p6$cobkz+&o8igjy$k9!c@oixbnauuiqko0"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # This configures Pydantic to read from a .env file
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Instantiate once and reuse (Singleton pattern)
settings = Settings()
