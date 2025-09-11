from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, test_db_connection
from app.core.deps import get_current_user
from app.models.user import User
from app.services.user_service import create_default_admin

# Import all route modules
from .auth_routes import router as auth_router
from .tournament_routes import router as tournament_router
from .team_routes import router as team_router
from .match_routes import router as match_router
from .websocket_routes import router as websocket_router

router = APIRouter()

# Include all API routes with prefixes
router.include_router(auth_router, prefix="/auth", tags=["authentication"])
router.include_router(tournament_router, prefix="/tournaments", tags=["tournaments"])
router.include_router(team_router, prefix="/teams", tags=["teams"])
router.include_router(match_router, prefix="/matches", tags=["matches"])
router.include_router(websocket_router, tags=["websockets"])


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