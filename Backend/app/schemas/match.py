from pydantic import BaseModel, UUID4, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.models.match import MatchStatus


class MatchBase(BaseModel):
    tournament_id: UUID4
    team1_id: Optional[UUID4] = None
    team2_id: Optional[UUID4] = None
    round_number: int = Field(..., ge=1)
    match_number: int = Field(..., ge=1)
    bracket_position: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    best_of: int = Field(default=1, ge=1, le=7)
    map_pool: Optional[List[str]] = None
    server_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=1000)


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    best_of: Optional[int] = Field(None, ge=1, le=7)
    map_pool: Optional[List[str]] = None
    selected_maps: Optional[List[str]] = None
    server_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=1000)


class MatchResultSubmission(BaseModel):
    team1_score: int = Field(..., ge=0)
    team2_score: int = Field(..., ge=0)
    winner_id: Optional[UUID4] = None
    game_results: Optional[List[Dict[str, Any]]] = None
    selected_maps: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=1000)

    @validator('winner_id')
    def winner_must_be_valid(cls, v, values):
        team1_score = values.get('team1_score', 0)
        team2_score = values.get('team2_score', 0)
        
        if team1_score == team2_score:
            # Draw - winner_id should be None
            if v is not None:
                raise ValueError('Winner ID must be None for draws')
        else:
            # Someone won - winner_id must be provided
            if v is None:
                raise ValueError('Winner ID must be provided when there is a winner')
        
        return v


class GameResultCreate(BaseModel):
    match_id: UUID4
    game_number: int = Field(..., ge=1)
    map_played: Optional[str] = None
    team1_score: int = Field(..., ge=0)
    team2_score: int = Field(..., ge=0)
    winner_id: Optional[UUID4] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    game_details: Optional[Dict[str, Any]] = None


class GameResultResponse(BaseModel):
    id: UUID4
    match_id: UUID4
    game_number: int
    map_played: Optional[str] = None
    team1_score: int
    team2_score: int
    winner_id: Optional[UUID4] = None
    winner_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    game_details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    id: UUID4
    name: str
    tag: str

    class Config:
        from_attributes = True


class MatchResponse(MatchBase):
    id: UUID4
    status: MatchStatus
    team1: Optional[TeamSummary] = None
    team2: Optional[TeamSummary] = None
    team1_score: int
    team2_score: int
    winner: Optional[TeamSummary] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    selected_maps: Optional[List[str]] = None
    ai_summary: Optional[str] = None
    summary_generated_at: Optional[datetime] = None
    is_verified: bool
    reported_by_id: Optional[UUID4] = None
    verified_by_id: Optional[UUID4] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MatchDetailResponse(MatchResponse):
    game_results: List[GameResultResponse] = []

    class Config:
        from_attributes = True


class MatchListResponse(BaseModel):
    id: UUID4
    tournament_name: str
    team1_name: Optional[str] = None
    team1_tag: Optional[str] = None
    team2_name: Optional[str] = None
    team2_tag: Optional[str] = None
    round_number: int
    match_number: int
    status: MatchStatus
    team1_score: int
    team2_score: int
    winner_name: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    actual_start_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    user_id: UUID4
    title: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=1000)
    notification_type: str
    tournament_id: Optional[UUID4] = None
    match_id: Optional[UUID4] = None
    team_id: Optional[UUID4] = None


class NotificationResponse(BaseModel):
    id: UUID4
    title: str
    message: str
    notification_type: str
    tournament_id: Optional[UUID4] = None
    match_id: Optional[UUID4] = None
    team_id: Optional[UUID4] = None
    is_read: bool
    is_email_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MatchStatsResponse(BaseModel):
    total_matches: int
    completed_matches: int
    scheduled_matches: int
    in_progress_matches: int
    matches_today: int
    average_match_duration: float

    class Config:
        from_attributes = True