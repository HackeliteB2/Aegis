from pydantic import BaseModel, UUID4, Field, validator, computed_field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.tournament import TournamentStatus, TournamentFormat


class TournamentBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    game_title: str = Field(..., min_length=2, max_length=50)
    format: TournamentFormat
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    tournament_start: Optional[datetime] = None
    tournament_end: Optional[datetime] = None
    max_teams: int = Field(default=32, ge=4, le=128)
    min_teams: int = Field(default=8, ge=2, le=64)
    team_size: int = Field(default=5, ge=1, le=10)
    rules: Optional[str] = Field(None, max_length=2000)
    prize_pool: Optional[str] = Field(None, max_length=100)
    entry_fee: str = Field(default="Free", max_length=50)
    is_public: bool = Field(default=True)
    allow_spectators: bool = Field(default=True)

    @validator('registration_end')
    def registration_end_after_start(cls, v, values):
        if v and 'registration_start' in values and values['registration_start']:
            if v <= values['registration_start']:
                raise ValueError('Registration end must be after registration start')
        return v

    @validator('tournament_start')
    def tournament_start_after_registration_end(cls, v, values):
        if v and 'registration_end' in values and values['registration_end']:
            if v <= values['registration_end']:
                raise ValueError('Tournament start must be after registration end')
        return v


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    tournament_start: Optional[datetime] = None
    tournament_end: Optional[datetime] = None
    max_teams: Optional[int] = Field(None, ge=4, le=128)
    min_teams: Optional[int] = Field(None, ge=2, le=64)
    rules: Optional[str] = Field(None, max_length=2000)
    prize_pool: Optional[str] = Field(None, max_length=100)
    entry_fee: Optional[str] = Field(None, max_length=50)
    is_public: Optional[bool] = None
    allow_spectators: Optional[bool] = None


class TournamentResponse(TournamentBase):
    id: UUID4
    status: TournamentStatus
    organizer_id: UUID4
    current_teams: int = Field(default=0)
    draw_transaction_hash: Optional[str] = None
    blockchain_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TournamentListResponse(BaseModel):
    id: UUID4
    name: str
    game_title: str
    format: TournamentFormat
    status: TournamentStatus
    current_teams: int
    max_teams: int
    tournament_start: Optional[datetime] = None
    entry_fee: str
    is_public: bool
    organizer_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TournamentRegistration(BaseModel):
    team_id: UUID4


class BracketResponse(BaseModel):
    id: UUID4
    tournament_id: UUID4
    bracket_data: dict
    round_number: int
    is_final: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TournamentStatsResponse(BaseModel):
    total_tournaments: int
    active_tournaments: int
    completed_tournaments: int
    total_matches: int
    total_teams: int
    upcoming_matches: int

    class Config:
        from_attributes = True