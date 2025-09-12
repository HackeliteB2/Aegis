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
from .chatbot_routes import router as chatbot_router

router = APIRouter()

# Include all API routes with prefixes
router.include_router(auth_router, prefix="/auth", tags=["authentication"])
router.include_router(tournament_router, prefix="/tournaments", tags=["tournaments"])
router.include_router(team_router, prefix="/teams", tags=["teams"])
router.include_router(match_router, prefix="/matches", tags=["matches"])
router.include_router(websocket_router, tags=["websockets"])
router.include_router(chatbot_router, prefix="/chatbot", tags=["chatbot"])


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

@router.get("/services/status")
async def get_services_status():
    """Get status of all external services."""
    from app.services.blockchain_service import BlockchainService
    from app.services.notification_service import NotificationService
    from app.services.gemini_service import GeminiService
    
    # Initialize services
    blockchain = BlockchainService()
    notification = NotificationService()
    gemini = GeminiService()
    
    # Check blockchain connection
    blockchain_connected = False
    chain_id = None
    if blockchain.enabled and hasattr(blockchain, 'w3'):
        try:
            blockchain_connected = blockchain.w3.is_connected()
            if blockchain_connected:
                chain_id = blockchain.w3.eth.chain_id
        except:
            blockchain_connected = False
    
    return {
        "blockchain": {
            "enabled": blockchain.enabled,
            "connected": blockchain_connected,
            "chain_id": chain_id,
            "status": "connected" if (blockchain.enabled and blockchain_connected) else "disconnected"
        },
        "email": {
            "enabled": notification.sendgrid_enabled,
            "provider": "SendGrid",
            "status": "enabled" if notification.sendgrid_enabled else "disabled"
        },
        "ai": {
            "enabled": gemini.is_enabled(),
            "provider": "Google Gemini",
            "status": "enabled" if gemini.is_enabled() else "disabled"
        },
        "database": {
            "connected": test_db_connection(),
            "status": "connected" if test_db_connection() else "disconnected"
        }
    }

@router.get("/services/blockchain/status")
async def get_blockchain_status():
    """Get detailed blockchain service status."""
    from app.services.blockchain_service import BlockchainService
    
    blockchain = BlockchainService()
    
    if not blockchain.enabled:
        return {
            "enabled": False,
            "connected": False,
            "status": "disabled",
            "error": "Blockchain service not enabled - missing configuration"
        }
    
    try:
        blockchain_connected = blockchain.w3.is_connected() if hasattr(blockchain, 'w3') else False
        if not blockchain_connected:
            return {
                "enabled": True,
                "connected": False,
                "status": "disconnected",
                "error": "Cannot connect to blockchain network"
            }
        
        chain_id = blockchain.w3.eth.chain_id
        network_name = "Polygon Mainnet" if chain_id == 137 else f"Chain {chain_id}"
        
        return {
            "enabled": True,
            "connected": True,
            "status": "connected",
            "chain_id": chain_id,
            "network": network_name,
            "contract_address": blockchain.contract_address,
            "provider": blockchain.web3_provider
        }
    except Exception as e:
        return {
            "enabled": True,
            "connected": False,
            "status": "error",
            "error": f"Blockchain connection error: {str(e)}"
        }