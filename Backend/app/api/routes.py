from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, test_db_connection
from app.core.deps import get_current_user
from app.models.user import User
from app.services.user_service import create_default_admin
from .auth_routes import router as auth_router

router = APIRouter()

# Include authentication routes
router.include_router(auth_router)


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}


@router.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Aegis Backend API is running"}


@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Example protected route."""
    return {
        "message": f"Hello {current_user.username}!",
        "user_role": current_user.role,
        "user_id": current_user.id
    }