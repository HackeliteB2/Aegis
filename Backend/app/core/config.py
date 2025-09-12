from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    APP_NAME: str = "Aegis Backend"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/aegis_db"
    
    # Security Configuration
    JWT_SECRET_KEY: str = "your-secret-key-here-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = ["*"]
    
    # Google Gemini API Configuration
    GOOGLE_GEMINI_API_KEY: str = "your-google-gemini-api-key"
    
    # SendGrid Email Configuration
    SENDGRID_API_KEY: str = "your-sendgrid-api-key"
    FROM_EMAIL: str = "noreply@aegis-tournaments.com"
    
    # Blockchain Configuration
    POLYGON_RPC_URL: str = "https://polygon-rpc.com/"
    TOURNAMENT_CONTRACT_ADDRESS: str = ""
    BLOCKCHAIN_PRIVATE_KEY: str = "your-private-key-for-blockchain-transactions"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIRECTORY: str = "uploads/"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @field_validator('BACKEND_CORS_ORIGINS')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


settings = Settings()