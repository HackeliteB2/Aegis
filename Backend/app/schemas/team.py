from pydantic import BaseModel, UUID4, Field, validator
from typing import Optional, List
from datetime import datetime

from app.models.team import TeamStatus


class TeamBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    tag: str = Field(..., min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    discord_server: Optional[str] = None

    @validator('tag')
    def tag_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Team tag must be alphanumeric')
        return v.upper()

    @validator('name')
    def name_no_special_chars(cls, v):
        if not all(c.isalnum() or c.isspace() or c in '-_' for c in v):
            raise ValueError('Team name can only contain letters, numbers, spaces, hyphens, and underscores')
        return v


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    tag: Optional[str] = Field(None, min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    discord_server: Optional[str] = None

    @validator('tag')
    def tag_alphanumeric(cls, v):
        if v and not v.isalnum():
            raise ValueError('Team tag must be alphanumeric')
        return v.upper() if v else v


class TeamMemberResponse(BaseModel):
    id: UUID4
    username: str
    name: str
    role: str  # player, substitute, coach, etc.
    joined_date: datetime
    is_active: bool

    class Config:
        from_attributes = True


class TeamResponse(TeamBase):
    id: UUID4
    status: TeamStatus
    captain_id: UUID4
    captain_name: str
    is_verified: bool
    wins: int
    losses: int
    draws: int
    win_rate: float = 0.0
    member_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @validator('win_rate', pre=True)
    def calculate_win_rate(cls, v, values):
        wins = values.get('wins', 0)
        losses = values.get('losses', 0)
        draws = values.get('draws', 0)
        total_games = wins + losses + draws
        if total_games == 0:
            return 0.0
        return round((wins / total_games) * 100, 2)


class TeamDetailResponse(TeamResponse):
    members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    id: UUID4
    name: str
    tag: str
    captain_name: str
    member_count: int
    wins: int
    losses: int
    draws: int
    win_rate: float
    status: TeamStatus
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TeamInvitation(BaseModel):
    user_id: UUID4
    role: str = Field(default="player")


class TeamMemberAction(BaseModel):
    user_id: UUID4
    action: str = Field(..., pattern="^(add|remove|promote|demote)$")
    role: Optional[str] = "player"


class TeamStatsResponse(BaseModel):
    total_teams: int
    verified_teams: int
    active_teams: int
    teams_in_tournaments: int
    average_team_size: float

    class Config:
        from_attributes = True