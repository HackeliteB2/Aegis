from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class ChatbotQuery(BaseModel):
    """Schema for chatbot questions."""
    question: str = Field(..., min_length=1, max_length=1000, description="User's question")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the question")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "How do I register my team for a tournament?",
                "context": {
                    "tournament_id": "123e4567-e89b-12d3-a456-426614174000",
                    "team_name": "My Team"
                }
            }
        }


class ChatbotSource(BaseModel):
    """Schema for information sources used in chatbot responses."""
    content: str = Field(..., description="Excerpt from the source document")
    metadata: Dict[str, Any] = Field(..., description="Source metadata (type, source, etc.)")


class ChatbotResponse(BaseModel):
    """Schema for chatbot responses."""
    answer: str = Field(..., description="The chatbot's answer to the question")
    sources: List[ChatbotSource] = Field(default=[], description="Sources used to generate the answer")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for the answer")
    timestamp: str = Field(..., description="Response timestamp")
    user_context: Optional[Dict[str, Any]] = Field(None, description="User context used for the response")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up questions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "answer": "To register your team for a tournament, you need to...",
                "sources": [
                    {
                        "content": "Team registration process involves...",
                        "metadata": {"source": "team_management", "type": "rules"}
                    }
                ],
                "confidence": 0.85,
                "timestamp": "2024-01-01T12:00:00",
                "user_context": {"role": "PLAYER", "user_id": "123"},
                "suggestions": [
                    "What are the team requirements?",
                    "How do I add team members?",
                    "What's the registration deadline?"
                ]
            }
        }


class ChatbotSuggestions(BaseModel):
    """Schema for chatbot conversation suggestions."""
    suggestions: List[str] = Field(..., description="List of suggested questions")
    user_context: Optional[Dict[str, Any]] = Field(None, description="User context for personalized suggestions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "suggestions": [
                    "How do I create a tournament?",
                    "What are the match rules?",
                    "How does the blockchain draw system work?"
                ],
                "user_context": {"role": "ORGANIZER"}
            }
        }


class KnowledgeUpdate(BaseModel):
    """Schema for adding new knowledge to the chatbot."""
    content: str = Field(..., min_length=10, description="Knowledge content to add")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Metadata about the knowledge")
    timestamp: Optional[str] = Field(None, description="When the knowledge was created")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "New tournament rule: Teams must have at least 5 players to participate in championship events.",
                "metadata": {
                    "source": "tournament_rules_2024",
                    "type": "rules",
                    "category": "team_requirements"
                },
                "timestamp": "2024-01-01T12:00:00"
            }
        }


class ChatbotStatus(BaseModel):
    """Schema for chatbot service status."""
    service: str = Field(..., description="Service name")
    status: str = Field(..., description="Current service status")
    knowledge_base: str = Field(..., description="Knowledge base status")
    llm_backend: str = Field(..., description="LLM backend information")
    embedding_model: str = Field(..., description="Embedding model information")
    features: List[str] = Field(default=[], description="Available features")
    error: Optional[str] = Field(None, description="Error message if any")
    
    class Config:
        json_schema_extra = {
            "example": {
                "service": "RAG Chatbot",
                "status": "operational",
                "knowledge_base": "initialized",
                "llm_backend": "Gemini 2.0 Flash",
                "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
                "features": [
                    "Retrieval-Augmented Generation",
                    "Context-aware responses",
                    "Dynamic knowledge updates"
                ]
            }
        }


class ChatbotConversation(BaseModel):
    """Schema for chatbot conversation history."""
    conversation_id: str = Field(..., description="Unique conversation identifier")
    messages: List[Dict[str, Any]] = Field(default=[], description="Conversation messages")
    user_id: Optional[str] = Field(None, description="User ID if authenticated")
    created_at: str = Field(..., description="Conversation creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "conversation_id": "conv_123456",
                "messages": [
                    {
                        "type": "user",
                        "content": "How do I create a tournament?",
                        "timestamp": "2024-01-01T12:00:00"
                    },
                    {
                        "type": "assistant",
                        "content": "To create a tournament, you need to...",
                        "timestamp": "2024-01-01T12:00:05",
                        "confidence": 0.9
                    }
                ],
                "user_id": "user_123",
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:05"
            }
        }


class ChatbotFeedback(BaseModel):
    """Schema for chatbot response feedback."""
    response_id: str = Field(..., description="ID of the response being rated")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    feedback: Optional[str] = Field(None, max_length=500, description="Optional feedback text")
    user_id: Optional[str] = Field(None, description="User providing feedback")
    timestamp: str = Field(..., description="Feedback timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response_id": "resp_123456",
                "rating": 4,
                "feedback": "Very helpful, but could be more specific about deadlines",
                "user_id": "user_123",
                "timestamp": "2024-01-01T12:00:00"
            }
        }