from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class TeamStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    tag = Column(String(10), nullable=False, unique=True, index=True)  # team tag/abbreviation
    description = Column(Text)
    logo_url = Column(String)  # URL to team logo
    
    # Team status and settings
    status = Column(SQLEnum(TeamStatus), default=TeamStatus.ACTIVE)
    is_verified = Column(Boolean, default=False)
    
    # Captain information
    captain_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Contact information
    contact_email = Column(String)
    discord_server = Column(String)
    
    # Statistics
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    captain = relationship("User", back_populates="captained_teams", foreign_keys=[captain_id])
    players = relationship("User", secondary="team_members", back_populates="teams")
    tournaments = relationship("Tournament", secondary="tournament_teams", back_populates="teams")
    home_matches = relationship("Match", foreign_keys="Match.team1_id", back_populates="team1")
    away_matches = relationship("Match", foreign_keys="Match.team2_id", back_populates="team2")


# Association table for team-user many-to-many relationship
from sqlalchemy import Table
team_members = Table(
    'team_members',
    Base.metadata,
    Column('team_id', UUID(as_uuid=True), ForeignKey('teams.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('joined_date', DateTime(timezone=True), server_default=func.now()),
    Column('is_active', Boolean, default=True),
    Column('role', String, default='player')  # player, substitute, coach, etc.
)