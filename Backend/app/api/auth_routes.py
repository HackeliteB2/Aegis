from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import create_token_response
from app.core.deps import get_current_user, get_current_admin_user
from app.schemas.user import UserLogin, UserCreate, User, AuthResponse, Token
from app.services.user_service import authenticate_user, create_user, get_all_users
from app.models.user import User as UserModel

# Create a fresh router with no dependencies
router = APIRouter()

@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user (public registration)."""
    return create_user(db, user_data)

@router.post("/login", response_model=AuthResponse)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token."""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = create_token_response(user.email)
    
    return {
        "user": user,
        "token": token_data
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token endpoint."""
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return create_token_response(user.email)

@router.get("/me", response_model=User)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@router.post("/logout")
async def logout(current_user: UserModel = Depends(get_current_user)):
    """Logout user (invalidate token on client side)."""
    return {"message": "Successfully logged out"}

@router.get("/users", response_model=list[User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Get all users (admin only)."""
    return get_all_users(db, skip=skip, limit=limit)

@router.put("/users/profile", response_model=User)
async def update_user_profile(
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Update current user's profile."""
    from app.services.user_service import update_user
    from app.schemas.user import UserUpdate
    
    # Convert dict to UserUpdate schema
    user_update = UserUpdate(**profile_data)
    updated_user = update_user(db, current_user.id, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user

@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get user by ID."""
    from app.services.user_service import get_user_by_id
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
        user = get_user_by_id(db, user_uuid)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Delete user by ID (admin only)."""
    from app.services.user_service import delete_user
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
        success = delete_user(db, user_uuid)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return {"message": "User deleted successfully"}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )