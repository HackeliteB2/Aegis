from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
