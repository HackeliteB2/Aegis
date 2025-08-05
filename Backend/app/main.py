from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import create_tables, get_db
from app.api.routes import router
from app.services.user_service import create_default_admin

# Create database tables
create_tables()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    description="AEGIS API",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    """Create default admin user on startup."""
    db_gen = get_db()
    db = next(db_gen)
    try:
        create_default_admin(db)
    finally:
        next(db_gen, None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.API_V1_STR)