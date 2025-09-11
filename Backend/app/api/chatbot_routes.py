from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.chatbot import (
    ChatbotQuery, ChatbotResponse, ChatbotSuggestions,
    KnowledgeUpdate, ChatbotStatus
)
from app.services.chatbot_service import AegisRAGChatbotService

router = APIRouter()

# Initialize the chatbot service (singleton pattern) 
# Force re-initialization after changes - v2
chatbot_service = None

def get_chatbot_service() -> AegisRAGChatbotService:
    """Get or initialize the chatbot service."""
    global chatbot_service
    if chatbot_service is None:
        try:
            chatbot_service = AegisRAGChatbotService()
        except Exception as e:
            print(f"Error initializing chatbot service: {e}")
            # Return a minimal service for status reporting
            class FallbackService:
                def get_service_status(self):
                    return {
                        "service": "RAG Chatbot",
                        "status": "error", 
                        "knowledge_base": "unavailable",
                        "llm_backend": "unavailable",
                        "embedding_model": "unavailable",
                        "features": [],
                        "error": str(e)
                    }
                def ask_question(self, question, context=None):
                    return {
                        "answer": "Chatbot service is currently unavailable. Please try again later.",
                        "confidence": 0.0,
                        "timestamp": "unavailable",
                        "sources": []
                    }
                def get_conversation_suggestions(self, context=None):
                    return ["How to register for tournaments?", "What are the match rules?"]
            chatbot_service = FallbackService()
    return chatbot_service


@router.post("/ask", response_model=ChatbotResponse)
async def ask_chatbot(
    query: ChatbotQuery,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Ask the RAG-enhanced chatbot a question about tournaments, rules, or platform features.
    """
    try:
        chatbot = get_chatbot_service()
        
        # Build user context
        user_context = {}
        if current_user:
            user_context = {
                "user_id": str(current_user.id),
                "role": current_user.role.value,
                "username": current_user.username
            }
            
            # Add additional context from query if provided
            if hasattr(query, 'context') and query.context:
                user_context.update(query.context)
        
        # Get response from chatbot
        result = chatbot.ask_question(query.question, user_context)
        
        return ChatbotResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            confidence=result.get("confidence", 0.0),
            timestamp=result["timestamp"],
            user_context=user_context,
            suggestions=chatbot.get_conversation_suggestions(user_context)[:3]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot service error: {str(e)}"
        )


@router.get("/suggestions", response_model=ChatbotSuggestions)
async def get_chatbot_suggestions(
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get conversation suggestions based on user context.
    """
    try:
        chatbot = get_chatbot_service()
        
        user_context = {}
        if current_user:
            user_context = {
                "user_id": str(current_user.id),
                "role": current_user.role.value,
                "username": current_user.username
            }
        
        suggestions = chatbot.get_conversation_suggestions(user_context)
        
        return ChatbotSuggestions(
            suggestions=suggestions,
            user_context=user_context
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting suggestions: {str(e)}"
        )


@router.post("/knowledge")
async def add_knowledge(
    knowledge: KnowledgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add new knowledge to the chatbot's knowledge base.
    Requires authentication and appropriate permissions.
    """
    # Check if user has permission to add knowledge (Admin or Organizer)
    if current_user.role.value not in ["ADMIN", "ORGANIZER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to add knowledge"
        )
    
    try:
        chatbot = get_chatbot_service()
        
        # Add metadata about who added the knowledge
        metadata = knowledge.metadata.copy() if knowledge.metadata else {}
        metadata.update({
            "added_by": current_user.username,
            "added_by_id": str(current_user.id),
            "added_at": knowledge.timestamp or "now"
        })
        
        chatbot.add_dynamic_knowledge(knowledge.content, metadata)
        
        return {
            "message": "Knowledge added successfully",
            "content_length": len(knowledge.content),
            "added_by": current_user.username
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding knowledge: {str(e)}"
        )


@router.get("/status", response_model=ChatbotStatus)
async def get_chatbot_status():
    """
    Get the current status of the chatbot service.
    """
    try:
        chatbot = get_chatbot_service()
        
        # Build status directly without relying on service method
        service_status = "operational"
        llm_status = "Gemini 2.0 Flash"
        embedding_status = "HuggingFace MiniLM" 
        knowledge_status = "loaded"
        error_msg = None
        features_list = [
            "RAG-enhanced responses",
            "Context-aware conversations", 
            "Role-based suggestions",
            "Dynamic knowledge updates"
        ]
        
        # Check if service has errors
        if hasattr(chatbot, 'initialization_errors') and chatbot.initialization_errors:
            service_status = "degraded"
            error_msg = "; ".join(chatbot.initialization_errors[:3])  # First 3 errors
            
        if hasattr(chatbot, 'llm') and not chatbot.llm:
            llm_status = "unavailable"
            
        if hasattr(chatbot, 'embeddings') and not chatbot.embeddings:
            embedding_status = "unavailable"
            
        return ChatbotStatus(
            service="Aegis RAG Chatbot",
            status=service_status,
            knowledge_base=knowledge_status,
            llm_backend=llm_status,
            embedding_model=embedding_status,
            features=features_list,
            error=error_msg
        )
        
    except Exception as e:
        return ChatbotStatus(
            service="RAG Chatbot",
            status="error",
            knowledge_base="unavailable",
            llm_backend="unavailable",
            embedding_model="unavailable",
            features=[],
            error=str(e)
        )


@router.post("/chat/tournament/{tournament_id}")
async def ask_about_tournament(
    tournament_id: UUID,
    query: ChatbotQuery,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask questions specifically about a tournament with tournament context.
    """
    try:
        chatbot = get_chatbot_service()
        
        # Build user context with tournament info
        user_context = {
            "tournament_id": str(tournament_id)
        }
        
        if current_user:
            user_context.update({
                "user_id": str(current_user.id),
                "role": current_user.role.value,
                "username": current_user.username
            })
        
        # Enhance question with tournament context
        enhanced_question = f"About tournament {tournament_id}: {query.question}"
        
        result = chatbot.ask_question(enhanced_question, user_context)
        
        return ChatbotResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            confidence=result.get("confidence", 0.0),
            timestamp=result["timestamp"],
            user_context=user_context,
            suggestions=chatbot.get_conversation_suggestions(user_context)[:3]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tournament chatbot error: {str(e)}"
        )


@router.post("/chat/team/{team_id}")
async def ask_about_team(
    team_id: UUID,
    query: ChatbotQuery,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask questions specifically about a team with team context.
    """
    try:
        chatbot = get_chatbot_service()
        
        # Build user context with team info
        user_context = {
            "team_id": str(team_id)
        }
        
        if current_user:
            user_context.update({
                "user_id": str(current_user.id),
                "role": current_user.role.value,
                "username": current_user.username
            })
        
        # Enhance question with team context
        enhanced_question = f"About team {team_id}: {query.question}"
        
        result = chatbot.ask_question(enhanced_question, user_context)
        
        return ChatbotResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            confidence=result.get("confidence", 0.0),
            timestamp=result["timestamp"],
            user_context=user_context,
            suggestions=chatbot.get_conversation_suggestions(user_context)[:3]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Team chatbot error: {str(e)}"
        )