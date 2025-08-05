from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate
from app.core.auth import get_password_hash, verify_password
from typing import Optional


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password."""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if user.status != UserStatus.ACTIVE:
        return None
    return user


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user."""
    # Check if username already exists
    if get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create user object
    db_user = User(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        role=user.role,
        status=user.status
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update user information."""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Handle password update
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Check for username conflicts
    if "username" in update_data and update_data["username"] != db_user.username:
        if get_user_by_username(db, update_data["username"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check for email conflicts
    if "email" in update_data and update_data["email"] != db_user.email:
        if get_user_by_email(db, update_data["email"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user."""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    
    return True


def create_default_admin(db: Session) -> User:
    """Create default admin user if it doesn't exist."""
    admin_user = get_user_by_username(db, "SuperAdmin")
    if admin_user:
        return admin_user
    
    default_admin = UserCreate(
        username="SuperAdmin",
        email="superadmin@aegis.example.com",
        name="Super Administrator",
        password="Admin123+",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE
    )
    
    return create_user(db, default_admin)
