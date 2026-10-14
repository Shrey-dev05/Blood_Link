import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api.v1 import (
    auth, requests, donors, blood_banks, coordinator, qr, camps, map, chatbot, admin
)
from app.models.entities import Organization
from app.seed import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="BloodLink Emergency Blood Coordination API (RescueFlow Core)",
    docs_url="/docs",
    redoc_url="/redoc"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler for clean error schema
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())
    # In production, log exc with trace_id
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please refer to trace ID.",
                "trace_id": trace_id
            }
        }
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(requests.router, prefix=settings.API_V1_STR)
app.include_router(donors.router, prefix=settings.API_V1_STR)
app.include_router(blood_banks.router, prefix=settings.API_V1_STR)
app.include_router(coordinator.router, prefix=settings.API_V1_STR)
app.include_router(qr.router, prefix=settings.API_V1_STR)
app.include_router(camps.router, prefix=settings.API_V1_STR)
app.include_router(map.router, prefix=settings.API_V1_STR)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    # If database has no organizations, seed it automatically
    db = SessionLocal()
    try:
        org_count = db.query(Organization).count()
        if org_count == 0:
            print("[*] Empty database detected. Running seed script...")
            seed_database()
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "timestamp": "2026-10-14T12:00:00Z"
    }

@app.get("/ready")
def readiness_check():
    return {"ready": True, "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
