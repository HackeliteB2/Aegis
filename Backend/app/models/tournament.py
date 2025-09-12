from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class TournamentStatus(Enum):
    DRAFT = "draft"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    DRAW_GENERATED = "draw_generated"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentFormat(Enum):
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"


class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    game_title = Column(String, nullable=False)
    format = Column(SQLEnum(TournamentFormat), nullable=False)
    status = Column(SQLEnum(TournamentStatus), default=TournamentStatus.DRAFT)
    
    # Dates
    registration_start = Column(DateTime(timezone=True))
    registration_end = Column(DateTime(timezone=True))
    tournament_start = Column(DateTime(timezone=True))
    tournament_end = Column(DateTime(timezone=True))
    
    # Capacity and settings
    max_teams = Column(Integer, default=32)
    min_teams = Column(Integer, default=8)
    team_size = Column(Integer, default=5)  # players per team
    
    # Tournament rules and settings
    rules = Column(Text)
    prize_pool = Column(String)
    entry_fee = Column(String, default="Free")
    
    # Blockchain integration
    draw_transaction_hash = Column(String)  # blockchain transaction hash for draw
    blockchain_verified = Column(Boolean, default=False)
    
    # Organizer
    organizer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional settings
    is_public = Column(Boolean, default=True)
    allow_spectators = Column(Boolean, default=True)
    tournament_settings = Column(JSON)  # flexible settings storage
    
    # Relationships
    organizer = relationship("User", back_populates="organized_tournaments")
    teams = relationship("Team", secondary="tournament_teams", back_populates="tournaments")
    matches = relationship("Match", back_populates="tournament")
    brackets = relationship("Bracket", back_populates="tournament")


class Bracket(Base):
    __tablename__ = "brackets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tournament_id = Column(UUID(as_uuid=True), ForeignKey("tournaments.id"), nullable=False)
    bracket_data = Column(JSON)  # stores the bracket structure
    round_number = Column(Integer, default=1)
    is_final = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tournament = relationship("Tournament", back_populates="brackets")


# Association table for tournament-team many-to-many relationship
from sqlalchemy import Table
tournament_teams = Table(
    'tournament_teams',
    Base.metadata,
    Column('tournament_id', UUID(as_uuid=True), ForeignKey('tournaments.id'), primary_key=True),
    Column('team_id', UUID(as_uuid=True), ForeignKey('teams.id'), primary_key=True),
    Column('registration_date', DateTime(timezone=True), server_default=func.now()),
    Column('is_approved', Boolean, default=False)
)