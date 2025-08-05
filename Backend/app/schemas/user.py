from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    username: str
    email: EmailStr
    name: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    username: Optional[str] = None


class AuthResponse(BaseModel):
    user: User
    token: Token
