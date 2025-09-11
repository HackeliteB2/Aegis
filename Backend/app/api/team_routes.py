from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.team import Team, TeamStatus
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse, TeamDetailResponse, TeamListResponse,
    TeamInvitation, TeamMemberAction, TeamStatsResponse
)
from app.services.team_service import TeamService

router = APIRouter()
team_service = TeamService()


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new team (user becomes captain)."""
    try:
        team = team_service.create_team(db, team_data, current_user.id)
        return team
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[TeamListResponse])
async def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[TeamStatus] = Query(None, description="Filter by team status"),
    search: Optional[str] = Query(None, description="Search by team name or tag"),
    verified_only: Optional[bool] = Query(None, description="Show only verified teams"),
    db: Session = Depends(get_db)
):
    """Get list of teams with optional filters."""
    teams = team_service.get_teams(
        db, skip=skip, limit=limit, status_filter=status_filter,
        search=search, verified_only=verified_only
    )
    return teams


@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team(
    team_id: UUID = Path(..., description="Team ID"),
    db: Session = Depends(get_db)
):
    """Get team details by ID."""
    team = team_service.get_team_with_members(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update team details (captain or admin only)."""
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Check permissions
    if team.captain_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only team captain or admin can update team")
    
    try:
        updated_team = team_service.update_team(db, team_id, team_data)
        return updated_team
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete team (captain or admin only)."""
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Check permissions
    if team.captain_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only team captain or admin can delete team")
    
    try:
        success = team_service.delete_team(db, team_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete team")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{team_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_player(
    team_id: UUID,
    invitation: TeamInvitation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Invite a player to join the team (captain only)."""
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Check permissions
    if team.captain_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only team captain can invite players")
    
    try:
        success = team_service.invite_player(db, team_id, invitation.user_id, invitation.role)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation failed")
        return {"message": "Player invited successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{team_id}/members/{user_id}/accept", status_code=status.HTTP_200_OK)
async def accept_invitation(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept team invitation (invited user only)."""
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only accept your own invitations")
    
    try:
        success = team_service.accept_invitation(db, team_id, user_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending invitation found")
        return {"message": "Invitation accepted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{team_id}/members/{user_id}/remove", status_code=status.HTTP_200_OK)
async def remove_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from the team (captain only) or leave team (member)."""
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Check permissions - captain can remove anyone, members can remove themselves
    if team.captain_id != current_user.id and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    # Captain cannot remove themselves
    if team.captain_id == user_id and current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Captain cannot leave team. Transfer captaincy first.")
    
    try:
        success = team_service.remove_member(db, team_id, user_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Member removal failed")
        return {"message": "Member removed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{team_id}/transfer-captaincy/{new_captain_id}", status_code=status.HTTP_200_OK)
async def transfer_captaincy(
    team_id: UUID,
    new_captain_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transfer team captaincy to another member."""
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Only current captain can transfer
    if team.captain_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only current captain can transfer captaincy")
    
    try:
        success = team_service.transfer_captaincy(db, team_id, new_captain_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Captaincy transfer failed")
        return {"message": "Captaincy transferred successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{team_id}/tournaments")
async def get_team_tournaments(
    team_id: UUID,
    db: Session = Depends(get_db)
):
    """Get tournaments this team is participating in."""
    tournaments = team_service.get_team_tournaments(db, team_id)
    return tournaments


@router.get("/{team_id}/matches")
async def get_team_matches(
    team_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get recent matches for this team."""
    matches = team_service.get_team_matches(db, team_id, limit)
    return matches


@router.get("/{team_id}/stats")
async def get_team_statistics(
    team_id: UUID,
    db: Session = Depends(get_db)
):
    """Get detailed team statistics."""
    stats = team_service.get_team_statistics(db, team_id)
    if not stats:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return stats


@router.get("/my-teams", response_model=List[TeamListResponse])
async def get_my_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get teams where current user is a member."""
    teams = team_service.get_user_teams(db, current_user.id)
    return teams


@router.get("/stats/overview", response_model=TeamStatsResponse)
async def get_team_stats_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Get team statistics overview (admin only)."""
    stats = team_service.get_team_stats(db)
    return stats


@router.post("/{team_id}/verify", status_code=status.HTTP_200_OK)
async def verify_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Verify a team (admin only)."""
    success = team_service.verify_team(db, team_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return {"message": "Team verified successfully"}


@router.post("/{team_id}/unverify", status_code=status.HTTP_200_OK)
async def unverify_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Remove verification from a team (admin only)."""
    success = team_service.unverify_team(db, team_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return {"message": "Team verification removed"}


@router.get("/search/{query}")
async def search_teams(
    query: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Search teams by name or tag."""
    teams = team_service.search_teams(db, query, limit)
    return teams