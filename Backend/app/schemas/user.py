from pydantic import BaseModel, EmailStr, UUID4, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.PLAYER
    status: UserStatus = UserStatus.ACTIVE
    bio: Optional[str] = Field(None, max_length=500)
    discord_username: Optional[str] = Field(None, max_length=50)
    steam_profile: Optional[str] = None
    preferred_games: Optional[str] = Field(None, max_length=200)
    skill_level: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=50)
    email_notifications: bool = Field(default=True)
    discord_notifications: bool = Field(default=False)

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    bio: Optional[str] = Field(None, max_length=500)
    discord_username: Optional[str] = Field(None, max_length=50)
    steam_profile: Optional[str] = None
    preferred_games: Optional[str] = Field(None, max_length=200)
    skill_level: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=50)

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    password: Optional[str] = Field(None, min_length=8)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    discord_username: Optional[str] = Field(None, max_length=50)
    steam_profile: Optional[str] = None
    preferred_games: Optional[str] = Field(None, max_length=200)
    skill_level: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=50)
    email_notifications: Optional[bool] = None
    discord_notifications: Optional[bool] = None

    @validator('username')
    def username_alphanumeric(cls, v):
        if v and not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    discord_username: Optional[str] = Field(None, max_length=50)
    steam_profile: Optional[str] = None
    preferred_games: Optional[str] = Field(None, max_length=200)
    skill_level: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=50)
    email_notifications: Optional[bool] = None
    discord_notifications: Optional[bool] = None


class UserInDB(UserBase):
    id: UUID4
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class UserResponse(BaseModel):
    id: UUID4
    username: str
    email: str
    name: str
    role: UserRole
    status: UserStatus
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    discord_username: Optional[str] = None
    steam_profile: Optional[str] = None
    preferred_games: Optional[str] = None
    skill_level: Optional[str] = None
    timezone: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: UUID4
    username: str
    name: str
    role: UserRole
    status: UserStatus
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str  # Changed from username to email for better UX
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[UUID4] = None


class AuthResponse(BaseModel):
    user: UserResponse
    token: Token


class UserStatsResponse(BaseModel):
    total_users: int
    active_users: int
    users_by_role: dict
    new_users_this_month: int
    
    class Config:
        from_attributes = True
