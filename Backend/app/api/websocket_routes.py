import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from typing import Optional

from app.services.websocket_service import get_connection_manager, get_websocket_handler, get_notification_service
from app.core.auth import decode_token
from app.models.user import User

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time updates."""
    connection_id = str(uuid.uuid4())
    manager = get_connection_manager()
    handler = get_websocket_handler()
    
    # Optional authentication
    user_data = None
    if token:
        try:
            payload = decode_token(token)
            user_data = {
                "user_id": payload.get("sub"),
                "username": payload.get("username"),
                "role": payload.get("role")
            }
        except Exception:
            # Allow anonymous connections
            pass
    
    await manager.connect(websocket, connection_id, user_data)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handler.handle_message(connection_id, message)
            except json.JSONDecodeError:
                await manager.send_personal_message(connection_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                await manager.send_personal_message(connection_id, {
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                })
    
    except WebSocketDisconnect:
        await manager.disconnect(connection_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await manager.disconnect(connection_id)


@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics (public endpoint)."""
    manager = get_connection_manager()
    stats = manager.get_subscription_stats()
    return stats


@router.post("/ws/broadcast/global")
async def broadcast_global_message(
    message: str,
    announcement_type: str = "general",
    current_user: User = Depends(lambda: None)  # TODO: Add proper admin auth
):
    """Broadcast global message to all connected clients (admin only)."""
    # TODO: Add proper admin authentication
    notification_service = get_notification_service()
    await notification_service.send_global_announcement(message, announcement_type)
    return {"message": "Global broadcast sent successfully"}


@router.post("/ws/test/match-update")
async def test_match_update(
    match_id: str,
    update_type: str,
    data: dict
):
    """Test endpoint for match updates (development only)."""
    notification_service = get_notification_service()
    await notification_service.notify_match_update(match_id, update_type, data)
    return {"message": "Match update sent"}


@router.post("/ws/test/tournament-update")
async def test_tournament_update(
    tournament_id: str,
    update_type: str,
    data: dict
):
    """Test endpoint for tournament updates (development only)."""
    notification_service = get_notification_service()
    await notification_service.notify_tournament_update(tournament_id, update_type, data)
    return {"message": "Tournament update sent"}


# WebSocket message format examples:
"""
Client -> Server messages:

1. Subscribe to tournament:
{
    "type": "subscribe_tournament",
    "tournament_id": "uuid-here"
}

2. Subscribe to match:
{
    "type": "subscribe_match",
    "match_id": "uuid-here"
}

3. Subscribe to team:
{
    "type": "subscribe_team",
    "team_id": "uuid-here"
}

4. Ping:
{
    "type": "ping"
}

5. Get stats:
{
    "type": "get_stats"
}

Server -> Client messages:

1. Connection established:
{
    "type": "connection_established",
    "message": "Connected to Aegis real-time updates",
    "connection_id": "uuid-here",
    "timestamp": "2024-01-01T12:00:00.000Z"
}

2. Match update:
{
    "type": "match_update",
    "update_type": "score_update",
    "match_id": "uuid-here",
    "data": {
        "team1_score": 2,
        "team2_score": 1,
        "current_map": "Dust2"
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
}

3. Tournament update:
{
    "type": "tournament_update",
    "update_type": "bracket_update",
    "tournament_id": "uuid-here",
    "data": {
        "bracket": {...}
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
}

4. Global announcement:
{
    "type": "global_announcement",
    "announcement_type": "maintenance",
    "message": "Server maintenance in 10 minutes",
    "timestamp": "2024-01-01T12:00:00.000Z"
}

5. Subscription confirmed:
{
    "type": "subscription_confirmed",
    "subscription": "tournament",
    "id": "uuid-here"
}

6. Error:
{
    "type": "error",
    "message": "Error description"
}

7. Pong (response to ping):
{
    "type": "pong",
    "timestamp": "2024-01-01T12:00:00.000Z"
}
"""