from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Aegis Backend"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/aegis_db"
    SECRET_KEY: str = "your-secret-key-here"
    
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()