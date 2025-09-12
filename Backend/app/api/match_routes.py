from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.match import Match, MatchStatus
from app.schemas.match import (
    MatchCreate, MatchUpdate, MatchResultSubmission, MatchResponse, MatchDetailResponse,
    MatchListResponse, GameResultCreate, GameResultResponse, NotificationCreate,
    NotificationResponse, MatchStatsResponse
)
from app.services.match_service import MatchService

router = APIRouter()
match_service = MatchService()


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Create a new match (Admin/Organizer only)."""
    try:
        match = match_service.create_match(db, match_data, current_user.id)
        return match
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[MatchListResponse])
async def list_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    tournament_id: Optional[UUID] = Query(None, description="Filter by tournament"),
    team_id: Optional[UUID] = Query(None, description="Filter by team"),
    status_filter: Optional[MatchStatus] = Query(None, description="Filter by match status"),
    db: Session = Depends(get_db)
):
    """Get list of matches with optional filters."""
    matches = match_service.get_matches(
        db, skip=skip, limit=limit, tournament_id=tournament_id,
        team_id=team_id, status_filter=status_filter
    )
    return matches


@router.get("/{match_id}", response_model=MatchDetailResponse)
async def get_match(
    match_id: UUID = Path(..., description="Match ID"),
    db: Session = Depends(get_db)
):
    """Get match details by ID."""
    match = match_service.get_match_detail(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


@router.put("/{match_id}", response_model=MatchResponse)
async def update_match(
    match_id: UUID,
    match_data: MatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Update match details (Admin/Organizer only)."""
    try:
        match = match_service.update_match(db, match_id, match_data, current_user.id)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        return match
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{match_id}/submit-result", response_model=MatchResponse)
async def submit_match_result(
    match_id: UUID,
    result_data: MatchResultSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit match results (team captains or admins)."""
    try:
        match = match_service.submit_result(db, match_id, result_data, current_user.id)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        return match
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{match_id}/verify", response_model=MatchResponse)
async def verify_match_result(
    match_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Verify match results (Admin only)."""
    match = match_service.verify_result(db, match_id, current_user.id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


@router.post("/{match_id}/dispute", status_code=status.HTTP_200_OK)
async def dispute_match_result(
    match_id: UUID,
    reason: str = Query(..., description="Reason for dispute"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dispute match results (team captains)."""
    try:
        success = match_service.dispute_result(db, match_id, current_user.id, reason)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dispute failed")
        return {"message": "Match result disputed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{match_id}/start", response_model=MatchResponse)
async def start_match(
    match_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Start a match (Admin/Organizer only)."""
    match = match_service.start_match(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


@router.post("/{match_id}/reschedule")
async def reschedule_match(
    match_id: UUID,
    new_time: str = Query(..., description="New scheduled time (ISO format)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Reschedule a match."""
    from datetime import datetime
    try:
        new_datetime = datetime.fromisoformat(new_time.replace('Z', '+00:00'))
        match = match_service.reschedule_match(db, match_id, new_datetime)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        return {"message": "Match rescheduled successfully", "new_time": new_datetime}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{match_id}/generate-summary", response_model=MatchResponse)
async def generate_match_summary(
    match_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Generate AI summary for completed match."""
    try:
        match = match_service.generate_ai_summary(db, match_id)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        return match
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{match_id}/game-results", response_model=List[GameResultResponse])
async def get_match_game_results(
    match_id: UUID,
    db: Session = Depends(get_db)
):
    """Get individual game results for a match."""
    results = match_service.get_game_results(db, match_id)
    return results


@router.post("/{match_id}/game-results", response_model=GameResultResponse, status_code=status.HTTP_201_CREATED)
async def add_game_result(
    match_id: UUID,
    game_result: GameResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add individual game result to a match."""
    try:
        result = match_service.add_game_result(db, match_id, game_result, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/upcoming", response_model=List[MatchListResponse])
async def get_upcoming_matches(
    hours: int = Query(24, ge=1, le=168, description="Hours ahead to look"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get upcoming matches in the next X hours."""
    matches = match_service.get_upcoming_matches(db, hours=hours, limit=limit)
    return matches


@router.get("/live", response_model=List[MatchListResponse])
async def get_live_matches(
    db: Session = Depends(get_db)
):
    """Get currently live matches."""
    matches = match_service.get_live_matches(db)
    return matches


@router.get("/recent", response_model=List[MatchListResponse])
async def get_recent_matches(
    days: int = Query(7, ge=1, le=30, description="Days back to look"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get recently completed matches."""
    matches = match_service.get_recent_matches(db, days=days, limit=limit)
    return matches


@router.get("/stats/overview", response_model=MatchStatsResponse)
async def get_match_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Get match statistics overview (admin only)."""
    stats = match_service.get_match_stats(db)
    return stats


@router.get("/tournament/{tournament_id}/bracket")
async def get_tournament_bracket_with_results(
    tournament_id: UUID,
    db: Session = Depends(get_db)
):
    """Get tournament bracket with match results."""
    bracket = match_service.get_tournament_bracket_with_results(db, tournament_id)
    if not bracket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament or bracket not found")
    return bracket


# Notification endpoints
@router.get("/notifications/", response_model=List[NotificationResponse])
async def get_user_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user notifications."""
    from app.services.notification_service import NotificationService
    notification_service = NotificationService()
    notifications = notification_service.get_user_notifications(
        db, current_user.id, skip=skip, limit=limit, unread_only=unread_only
    )
    return notifications


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    from app.services.notification_service import NotificationService
    notification_service = NotificationService()
    success = notification_service.mark_notification_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read."""
    from app.services.notification_service import NotificationService
    notification_service = NotificationService()
    count = notification_service.mark_all_read(db, current_user.id)
    return {"message": f"{count} notifications marked as read"}


@router.get("/notifications/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications."""
    from app.services.notification_service import NotificationService
    notification_service = NotificationService()
    count = notification_service.get_unread_count(db, current_user.id)
    return {"unread_count": count}