import os
from typing import Optional
from pydantic import BaseModel

# Automatically load local .env without tracking in git
def load_env():
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), "backend", ".env")
    ]
    for p in env_paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v

load_env()

class Settings(BaseModel):
    PROJECT_NAME: str = "BloodLink"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Demo Mode
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")
    
    # Database (Default SQLite for easy zero-setup run, Postgres compatible)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./raktareach.db")
    
    # Security / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "bloodlink-insecure-secret-key-for-development-only-2026")

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "*"]
    
    # QR Settings
    QR_TOKEN_TTL_MINUTES: int = 180  # 3 hours validity for arrival pass

    # LLM Chatbot Provider Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-20b")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")

    # Twilio Emergency SMS & Voice Call Settings
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_PHONE: str = os.getenv("TWILIO_FROM_PHONE", "+17372508034")
    TWILIO_DEFAULT_TO_PHONE: str = os.getenv("TWILIO_DEFAULT_TO_PHONE", "+917587769823")
    TWILIO_CALL_URL: str = os.getenv("TWILIO_CALL_URL", "https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition")
    TWILIO_SMS_BODY: str = os.getenv("TWILIO_SMS_BODY", "sms_internal_alerts")

settings = Settings()

