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
    
    LLM_PROVIDER: str = Field(default="mock", description="LLM service type (mock, gemini, groq, openrouter)")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama API base URL (dev fallback only)")
    OLLAMA_MODEL: str = Field(default="qwen2.5:1.5b", description="Ollama model string")
    
    GEMINI_API_KEY: Optional[str] = Field(default=None, description="Gemini API Key")
    GEMINI_MODEL: str = Field(default="gemini-1.5-flash", description="Gemini Model")
    
    GROQ_API_KEY: Optional[str] = Field(default=None, description="Groq API Key")
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile", description="Groq Model")
    
    OPENROUTER_API_KEY: Optional[str] = Field(default=None, description="OpenRouter API Key")
    OPENROUTER_MODEL: str = Field(default="google/gemini-2.5-flash", description="OpenRouter Model")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
