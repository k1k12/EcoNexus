from pydantic_settings import BaseSettings
from pydantic import Field, model_validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    test_database_url: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    CORS_ORIGINS: str = Field(..., env="CORS_ORIGINS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @model_validator(mode="after")
    def split_cors_origins(self) -> "Settings":
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self

settings = Settings()
