import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://postgres:password@localhost:5432/student360",
        description="Database connection URL"
    )
    SUPABASE_URL: Optional[str] = Field(default=None, description="Supabase project URL")
    SUPABASE_ANON_KEY: Optional[str] = Field(default=None, description="Supabase anonymous key")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None, description="Supabase service role key")
    SUPABASE_STORAGE_BUCKET: str = Field(default="student360-uploads", description="Supabase Storage bucket name")
    
    SECRET_KEY: str = Field(default="change-this-secret-key-for-production-use", description="JWT secret key")
    ALGORITHM: str = Field(default="HS256", description="JWT signature algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, description="Token duration in minutes")
    
    FRONTEND_URL: str = Field(default="https://kce-student360.vercel.app", description="Frontend URL for CORS")
    UPLOAD_DIR: str = Field(default="uploads", description="Local upload fallback directory")
    
    LLM_PROVIDER: str = Field(default="mock", description="LLM service type (mock or ollama)")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama API base URL")
    OLLAMA_MODEL: str = Field(default="qwen2.5:1.5b", description="Ollama model string")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
