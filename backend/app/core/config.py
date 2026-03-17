from pydantic_settings import BaseSettings, SettingsConfigDict
import secrets


class Settings(BaseSettings):
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./biozentra.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    def get_secret_key(self) -> str:
        if not self.SECRET_KEY:
            raise RuntimeError(
                "SECRET_KEY environment variable is not set. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if self.SECRET_KEY in ("CHANGE_ME", "CHANGE_ME_USE_A_LONG_RANDOM_STRING_AT_LEAST_32_CHARS", "super-secret-key"):
            raise RuntimeError("SECRET_KEY is still set to a placeholder value. Please set a real secret key.")
        return self.SECRET_KEY


settings = Settings()
