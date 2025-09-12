from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ORGANIZER = "organizer"
    PLAYER = "player"
    SPECTATOR = "spectator"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PLAYER)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    
    # Additional profile information
    bio = Column(String(500))
    avatar_url = Column(String)
    discord_username = Column(String)
    steam_profile = Column(String)
    
    # Gaming information
    preferred_games = Column(String)  # comma-separated list
    skill_level = Column(String)
    timezone = Column(String)
    
    # Notification preferences
    email_notifications = Column(Boolean, default=True)
    discord_notifications = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organized_tournaments = relationship("Tournament", back_populates="organizer")
    captained_teams = relationship("Team", back_populates="captain")
    teams = relationship("Team", secondary="team_members", back_populates="players")
