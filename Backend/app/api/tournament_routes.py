from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.tournament import Tournament, TournamentStatus, Bracket
from app.models.team import Team
from app.schemas.tournament import (
    TournamentCreate, TournamentUpdate, TournamentResponse, TournamentListResponse,
    TournamentRegistration, BracketResponse, TournamentStatsResponse
)
from app.services.tournament_service import TournamentService
from app.services.blockchain_service import BlockchainService

router = APIRouter()
tournament_service = TournamentService()
blockchain_service = BlockchainService()


@router.post("/", response_model=TournamentResponse, status_code=status.HTTP_201_CREATED)
async def create_tournament(
    tournament_data: TournamentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """Create a new tournament (Organizers and Admins only)."""
    try:
        tournament = tournament_service.create_tournament(db, tournament_data, current_user.id)
        return tournament_service.get_tournament_with_details(db, tournament.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[TournamentListResponse])
async def list_tournaments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[TournamentStatus] = Query(None, description="Filter by tournament status"),
    game_title: Optional[str] = Query(None, description="Filter by game title"),
    organizer_id: Optional[UUID] = Query(None, description="Filter by organizer"),
    db: Session = Depends(get_db)
):
    """Get list of tournaments with optional filters."""
    tournaments = tournament_service.get_tournaments(
        db, skip=skip, limit=limit, status_filter=status_filter,
        game_title=game_title, organizer_id=organizer_id
    )
    return tournaments


@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(
    tournament_id: UUID = Path(..., description="Tournament ID"),
    db: Session = Depends(get_db)
):
    """Get tournament details by ID."""
    tournament = tournament_service.get_tournament_with_details(db, tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    return tournament


@router.put("/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: UUID,
    tournament_data: TournamentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tournament details (organizer or admin only)."""
    tournament = tournament_service.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    # Check permissions
    if tournament.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this tournament")
    
    try:
        updated_tournament = tournament_service.update_tournament(db, tournament_id, tournament_data)
        if updated_tournament:
            return tournament_service.get_tournament_with_details(db, tournament_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tournament(
    tournament_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Delete tournament (admin only)."""
    success = tournament_service.delete_tournament(db, tournament_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")


@router.post("/{tournament_id}/register", status_code=status.HTTP_201_CREATED)
async def register_team(
    tournament_id: UUID,
    registration: TournamentRegistration,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a team for a tournament."""
    try:
        success = tournament_service.register_team(db, tournament_id, registration.team_id, current_user.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed")
        return {"message": "Team registered successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{tournament_id}/register/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unregister_team(
    tournament_id: UUID,
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unregister a team from a tournament."""
    try:
        success = tournament_service.unregister_team(db, tournament_id, team_id, current_user.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unregistration failed")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{tournament_id}/teams", response_model=List[dict])
async def get_tournament_teams(
    tournament_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all teams registered for a tournament."""
    teams = tournament_service.get_tournament_teams(db, tournament_id)
    return teams


@router.post("/{tournament_id}/generate-draw", response_model=BracketResponse)
async def generate_tournament_draw(
    tournament_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate tournament draw using blockchain for fairness."""
    tournament = tournament_service.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    # Check permissions
    if tournament.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to generate draw")
    
    try:
        bracket = tournament_service.generate_draw(db, tournament_id)
        return bracket
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{tournament_id}/bracket", response_model=BracketResponse)
async def get_tournament_bracket(
    tournament_id: UUID,
    db: Session = Depends(get_db)
):
    """Get current tournament bracket."""
    bracket = tournament_service.get_tournament_bracket(db, tournament_id)
    if not bracket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bracket not found")
    return bracket


@router.post("/{tournament_id}/start", response_model=TournamentResponse)
async def start_tournament(
    tournament_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start the tournament (organizer or admin only)."""
    tournament = tournament_service.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    # Check permissions
    if tournament.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to start this tournament")
    
    try:
        started_tournament = tournament_service.start_tournament(db, tournament_id)
        return started_tournament
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{tournament_id}/complete", response_model=TournamentResponse)
async def complete_tournament(
    tournament_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark tournament as completed (organizer or admin only)."""
    tournament = tournament_service.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    # Check permissions
    if tournament.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to complete this tournament")
    
    try:
        completed_tournament = tournament_service.complete_tournament(db, tournament_id)
        return completed_tournament
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/stats/overview", response_model=TournamentStatsResponse)
async def get_tournament_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Get tournament statistics overview (admin/organizer only)."""
    stats = tournament_service.get_tournament_stats(db)
    return stats


@router.get("/my-tournaments", response_model=List[TournamentListResponse])
async def get_my_tournaments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """Get tournaments organized by current user."""
    tournaments = tournament_service.get_tournaments(db, organizer_id=current_user.id)
    return tournaments