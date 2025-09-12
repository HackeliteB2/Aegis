import asyncio
import json
from typing import Dict, List, Set, Optional
from uuid import UUID
import logging
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

from app.models.user import User
from app.core.auth import decode_token

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        # Store active connections by user ID
        self.active_connections: Dict[str, WebSocket] = {}
        # Store connections subscribed to specific tournaments
        self.tournament_subscribers: Dict[str, Set[str]] = {}
        # Store connections subscribed to specific matches
        self.match_subscribers: Dict[str, Set[str]] = {}
        # Store connections subscribed to team updates
        self.team_subscribers: Dict[str, Set[str]] = {}
        # Store user info for connections
        self.connection_users: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, connection_id: str, user_data: Optional[dict] = None):
        """Accept a WebSocket connection."""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if user_data:
            self.connection_users[connection_id] = user_data
        
        logger.info(f"WebSocket connection established: {connection_id}")
        
        # Send welcome message
        await self.send_personal_message(connection_id, {
            "type": "connection_established",
            "message": "Connected to Aegis real-time updates",
            "connection_id": connection_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def disconnect(self, connection_id: str):
        """Handle WebSocket disconnection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        # Remove from all subscriptions
        for tournament_id, subscribers in self.tournament_subscribers.items():
            subscribers.discard(connection_id)
        
        for match_id, subscribers in self.match_subscribers.items():
            subscribers.discard(connection_id)
        
        for team_id, subscribers in self.team_subscribers.items():
            subscribers.discard(connection_id)
        
        if connection_id in self.connection_users:
            del self.connection_users[connection_id]
        
        logger.info(f"WebSocket connection closed: {connection_id}")

    async def send_personal_message(self, connection_id: str, data: dict):
        """Send a message to a specific connection."""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                await self.disconnect(connection_id)

    async def broadcast_to_tournament(self, tournament_id: str, data: dict):
        """Broadcast message to all subscribers of a tournament."""
        if tournament_id in self.tournament_subscribers:
            subscribers = self.tournament_subscribers[tournament_id].copy()
            
            message = {
                **data,
                "tournament_id": tournament_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            for connection_id in subscribers:
                await self.send_personal_message(connection_id, message)
            
            logger.info(f"Broadcast to tournament {tournament_id}: {len(subscribers)} subscribers")

    async def broadcast_to_match(self, match_id: str, data: dict):
        """Broadcast message to all subscribers of a match."""
        if match_id in self.match_subscribers:
            subscribers = self.match_subscribers[match_id].copy()
            
            message = {
                **data,
                "match_id": match_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            for connection_id in subscribers:
                await self.send_personal_message(connection_id, message)
            
            logger.info(f"Broadcast to match {match_id}: {len(subscribers)} subscribers")

    async def broadcast_to_team(self, team_id: str, data: dict):
        """Broadcast message to all subscribers of a team."""
        if team_id in self.team_subscribers:
            subscribers = self.team_subscribers[team_id].copy()
            
            message = {
                **data,
                "team_id": team_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            for connection_id in subscribers:
                await self.send_personal_message(connection_id, message)
            
            logger.info(f"Broadcast to team {team_id}: {len(subscribers)} subscribers")

    async def broadcast_global(self, data: dict):
        """Broadcast message to all connected clients."""
        message = {
            **data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        connections = list(self.active_connections.keys())
        for connection_id in connections:
            await self.send_personal_message(connection_id, message)
        
        logger.info(f"Global broadcast to {len(connections)} connections")

    def subscribe_to_tournament(self, connection_id: str, tournament_id: str):
        """Subscribe a connection to tournament updates."""
        if tournament_id not in self.tournament_subscribers:
            self.tournament_subscribers[tournament_id] = set()
        
        self.tournament_subscribers[tournament_id].add(connection_id)
        logger.info(f"Connection {connection_id} subscribed to tournament {tournament_id}")

    def unsubscribe_from_tournament(self, connection_id: str, tournament_id: str):
        """Unsubscribe a connection from tournament updates."""
        if tournament_id in self.tournament_subscribers:
            self.tournament_subscribers[tournament_id].discard(connection_id)
            
            # Clean up empty subscription sets
            if not self.tournament_subscribers[tournament_id]:
                del self.tournament_subscribers[tournament_id]

    def subscribe_to_match(self, connection_id: str, match_id: str):
        """Subscribe a connection to match updates."""
        if match_id not in self.match_subscribers:
            self.match_subscribers[match_id] = set()
        
        self.match_subscribers[match_id].add(connection_id)
        logger.info(f"Connection {connection_id} subscribed to match {match_id}")

    def unsubscribe_from_match(self, connection_id: str, match_id: str):
        """Unsubscribe a connection from match updates."""
        if match_id in self.match_subscribers:
            self.match_subscribers[match_id].discard(connection_id)
            
            if not self.match_subscribers[match_id]:
                del self.match_subscribers[match_id]

    def subscribe_to_team(self, connection_id: str, team_id: str):
        """Subscribe a connection to team updates."""
        if team_id not in self.team_subscribers:
            self.team_subscribers[team_id] = set()
        
        self.team_subscribers[team_id].add(connection_id)
        logger.info(f"Connection {connection_id} subscribed to team {team_id}")

    def unsubscribe_from_team(self, connection_id: str, team_id: str):
        """Unsubscribe a connection from team updates."""
        if team_id in self.team_subscribers:
            self.team_subscribers[team_id].discard(connection_id)
            
            if not self.team_subscribers[team_id]:
                del self.team_subscribers[team_id]

    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.active_connections)

    def get_subscription_stats(self) -> dict:
        """Get statistics about subscriptions."""
        return {
            "total_connections": len(self.active_connections),
            "tournament_subscriptions": {
                tournament_id: len(subscribers) 
                for tournament_id, subscribers in self.tournament_subscribers.items()
            },
            "match_subscriptions": {
                match_id: len(subscribers) 
                for match_id, subscribers in self.match_subscribers.items()
            },
            "team_subscriptions": {
                team_id: len(subscribers) 
                for team_id, subscribers in self.team_subscribers.items()
            }
        }


# Global connection manager instance
manager = ConnectionManager()


class WebSocketHandler:
    """Handles WebSocket message processing."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager

    async def handle_message(self, connection_id: str, message: dict):
        """Process incoming WebSocket messages."""
        message_type = message.get("type")
        
        try:
            if message_type == "subscribe_tournament":
                tournament_id = message.get("tournament_id")
                if tournament_id:
                    self.manager.subscribe_to_tournament(connection_id, tournament_id)
                    await self.manager.send_personal_message(connection_id, {
                        "type": "subscription_confirmed",
                        "subscription": "tournament",
                        "id": tournament_id
                    })
            
            elif message_type == "unsubscribe_tournament":
                tournament_id = message.get("tournament_id")
                if tournament_id:
                    self.manager.unsubscribe_from_tournament(connection_id, tournament_id)
                    await self.manager.send_personal_message(connection_id, {
                        "type": "unsubscription_confirmed",
                        "subscription": "tournament",
                        "id": tournament_id
                    })
            
            elif message_type == "subscribe_match":
                match_id = message.get("match_id")
                if match_id:
                    self.manager.subscribe_to_match(connection_id, match_id)
                    await self.manager.send_personal_message(connection_id, {
                        "type": "subscription_confirmed",
                        "subscription": "match",
                        "id": match_id
                    })
            
            elif message_type == "unsubscribe_match":
                match_id = message.get("match_id")
                if match_id:
                    self.manager.unsubscribe_from_match(connection_id, match_id)
                    await self.manager.send_personal_message(connection_id, {
                        "type": "unsubscription_confirmed",
                        "subscription": "match",
                        "id": match_id
                    })
            
            elif message_type == "subscribe_team":
                team_id = message.get("team_id")
                if team_id:
                    self.manager.subscribe_to_team(connection_id, team_id)
                    await self.manager.send_personal_message(connection_id, {
                        "type": "subscription_confirmed",
                        "subscription": "team",
                        "id": team_id
                    })
            
            elif message_type == "unsubscribe_team":
                team_id = message.get("team_id")
                if team_id:
                    self.manager.unsubscribe_from_team(connection_id, team_id)
                    await self.manager.send_personal_message(connection_id, {
                        "type": "unsubscription_confirmed",
                        "subscription": "team",
                        "id": team_id
                    })
            
            elif message_type == "ping":
                await self.manager.send_personal_message(connection_id, {
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "get_stats":
                stats = self.manager.get_subscription_stats()
                await self.manager.send_personal_message(connection_id, {
                    "type": "stats_response",
                    "data": stats
                })
            
            elif message_type == "authenticate":
                token = message.get("token")
                if token:
                    try:
                        from app.core.auth import decode_token
                        payload = decode_token(token)
                        user_data = {
                            "user_id": payload.get("sub"),
                            "username": payload.get("username"),
                            "role": payload.get("role")
                        }
                        # Update connection with user data
                        self.manager.connection_users[connection_id] = user_data
                        await self.manager.send_personal_message(connection_id, {
                            "type": "authentication_success",
                            "user": user_data
                        })
                        logger.info(f"Connection {connection_id} authenticated as {user_data.get('username')}")
                    except Exception as e:
                        await self.manager.send_personal_message(connection_id, {
                            "type": "authentication_failed",
                            "message": "Invalid token"
                        })
                        logger.warning(f"Authentication failed for connection {connection_id}: {e}")
                else:
                    await self.manager.send_personal_message(connection_id, {
                        "type": "authentication_failed",
                        "message": "No token provided"
                    })
            
            else:
                await self.manager.send_personal_message(connection_id, {
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                })
        
        except Exception as e:
            logger.error(f"Error handling message from {connection_id}: {e}")
            await self.manager.send_personal_message(connection_id, {
                "type": "error",
                "message": "Failed to process message"
            })


# Global WebSocket handler
handler = WebSocketHandler(manager)


class RealTimeNotificationService:
    """Service for sending real-time notifications via WebSocket."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager

    async def notify_match_update(self, match_id: str, update_type: str, data: dict):
        """Send real-time match update."""
        message = {
            "type": "match_update",
            "update_type": update_type,
            "data": data
        }
        await self.manager.broadcast_to_match(match_id, message)

    async def notify_tournament_update(self, tournament_id: str, update_type: str, data: dict):
        """Send real-time tournament update."""
        message = {
            "type": "tournament_update",
            "update_type": update_type,
            "data": data
        }
        await self.manager.broadcast_to_tournament(tournament_id, message)

    async def notify_team_update(self, team_id: str, update_type: str, data: dict):
        """Send real-time team update."""
        message = {
            "type": "team_update",
            "update_type": update_type,
            "data": data
        }
        await self.manager.broadcast_to_team(team_id, message)

    async def notify_bracket_update(self, tournament_id: str, bracket_data: dict):
        """Send real-time bracket update."""
        message = {
            "type": "bracket_update",
            "data": bracket_data
        }
        await self.manager.broadcast_to_tournament(tournament_id, message)

    async def notify_match_start(self, match_id: str, match_data: dict):
        """Notify that a match has started."""
        await self.notify_match_update(match_id, "match_started", match_data)
        
        # Also notify tournament subscribers
        tournament_id = match_data.get("tournament_id")
        if tournament_id:
            await self.notify_tournament_update(tournament_id, "match_started", match_data)

    async def notify_match_end(self, match_id: str, match_data: dict):
        """Notify that a match has ended."""
        await self.notify_match_update(match_id, "match_completed", match_data)
        
        # Also notify tournament subscribers
        tournament_id = match_data.get("tournament_id")
        if tournament_id:
            await self.notify_tournament_update(tournament_id, "match_completed", match_data)

    async def notify_score_update(self, match_id: str, score_data: dict):
        """Send real-time score updates during a match."""
        await self.notify_match_update(match_id, "score_update", score_data)

    async def send_global_announcement(self, message: str, announcement_type: str = "general"):
        """Send global announcement to all connected users."""
        data = {
            "type": "global_announcement",
            "announcement_type": announcement_type,
            "message": message
        }
        await self.manager.broadcast_global(data)


# Global notification service
notification_service = RealTimeNotificationService(manager)


def get_connection_manager() -> ConnectionManager:
    """Get the global connection manager instance."""
    return manager


def get_websocket_handler() -> WebSocketHandler:
    """Get the global WebSocket handler instance."""
    return handler


def get_notification_service() -> RealTimeNotificationService:
    """Get the global notification service instance."""
    return notification_service