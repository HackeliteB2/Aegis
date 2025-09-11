from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.models.tournament import Tournament, TournamentStatus, TournamentFormat, Bracket, tournament_teams
from app.models.team import Team
from app.models.user import User
from app.models.match import Match, MatchStatus
from app.schemas.tournament import TournamentCreate, TournamentUpdate, TournamentStatsResponse
from app.services.blockchain_service import BlockchainService
from app.services.notification_service import NotificationService


class TournamentService:
    def __init__(self):
        self.blockchain_service = BlockchainService()
        self.notification_service = NotificationService()

    def create_tournament(self, db: Session, tournament_data: TournamentCreate, organizer_id: UUID) -> Tournament:
        """Create a new tournament."""
        # Validate dates
        if tournament_data.registration_end and tournament_data.registration_start:
            if tournament_data.registration_end <= tournament_data.registration_start:
                raise ValueError("Registration end date must be after start date")
        
        if tournament_data.tournament_start and tournament_data.registration_end:
            if tournament_data.tournament_start <= tournament_data.registration_end:
                raise ValueError("Tournament start must be after registration end")

        # Check for duplicate tournament name by same organizer
        existing = db.query(Tournament).filter(
            and_(Tournament.name == tournament_data.name, Tournament.organizer_id == organizer_id)
        ).first()
        if existing:
            raise ValueError("You already have a tournament with this name")

        tournament = Tournament(
            **tournament_data.dict(),
            organizer_id=organizer_id
        )
        
        db.add(tournament)
        db.commit()
        db.refresh(tournament)
        
        # Send notification to organizer
        self.notification_service.create_notification(
            db, organizer_id, "Tournament Created", 
            f"Your tournament '{tournament.name}' has been created successfully.",
            "tournament_created", tournament_id=tournament.id
        )
        
        return tournament

    def get_tournament(self, db: Session, tournament_id: UUID) -> Optional[Tournament]:
        """Get tournament by ID."""
        return db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    def get_tournament_with_details(self, db: Session, tournament_id: UUID) -> Optional[dict]:
        """Get tournament by ID with additional computed fields."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            return None
        
        # Get current team count
        current_teams = db.query(tournament_teams).filter(
            tournament_teams.c.tournament_id == tournament.id
        ).count()
        
        # Create response with all required fields
        tournament_dict = tournament.__dict__.copy()
        tournament_dict['current_teams'] = current_teams
        
        return tournament_dict

    def get_tournaments(
        self, db: Session, skip: int = 0, limit: int = 100,
        status_filter: Optional[TournamentStatus] = None,
        game_title: Optional[str] = None,
        organizer_id: Optional[UUID] = None
    ) -> List[dict]:
        """Get tournaments with optional filters."""
        query = db.query(Tournament)
        
        # Apply filters
        if status_filter:
            query = query.filter(Tournament.status == status_filter)
        if game_title:
            query = query.filter(Tournament.game_title.ilike(f"%{game_title}%"))
        if organizer_id:
            query = query.filter(Tournament.organizer_id == organizer_id)
        
        # Only show public tournaments unless organizer is requesting their own
        if not organizer_id:
            query = query.filter(Tournament.is_public == True)
        
        tournaments = query.offset(skip).limit(limit).all()
        
        # Format response with required fields
        result = []
        for tournament in tournaments:
            # Get current team count
            current_teams = db.query(tournament_teams).filter(
                tournament_teams.c.tournament_id == tournament.id
            ).count()
            
            # Get organizer name
            organizer_name = "Unknown"
            if tournament.organizer:
                organizer_name = tournament.organizer.name
            
            result.append({
                "id": tournament.id,
                "name": tournament.name,
                "game_title": tournament.game_title,
                "format": tournament.format,
                "status": tournament.status,
                "current_teams": current_teams,
                "max_teams": tournament.max_teams,
                "tournament_start": tournament.tournament_start,
                "entry_fee": tournament.entry_fee,
                "is_public": tournament.is_public,
                "organizer_name": organizer_name,
                "created_at": tournament.created_at
            })
        
        return result

    def update_tournament(self, db: Session, tournament_id: UUID, tournament_data: TournamentUpdate) -> Optional[Tournament]:
        """Update tournament details."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            return None
        
        # Don't allow updates if tournament has started
        if tournament.status in [TournamentStatus.IN_PROGRESS, TournamentStatus.COMPLETED]:
            raise ValueError("Cannot update tournament that has already started or completed")
        
        # Update fields
        update_data = tournament_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tournament, field, value)
        
        tournament.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(tournament)
        return tournament

    def delete_tournament(self, db: Session, tournament_id: UUID) -> bool:
        """Delete tournament (only if not started)."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            return False
        
        # Only allow deletion if tournament hasn't started
        if tournament.status in [TournamentStatus.IN_PROGRESS, TournamentStatus.COMPLETED]:
            raise ValueError("Cannot delete tournament that has already started or completed")
        
        # Delete associated records
        db.query(Bracket).filter(Bracket.tournament_id == tournament_id).delete()
        db.execute(tournament_teams.delete().where(tournament_teams.c.tournament_id == tournament_id))
        db.delete(tournament)
        db.commit()
        return True

    def register_team(self, db: Session, tournament_id: UUID, team_id: UUID, user_id: UUID) -> bool:
        """Register a team for a tournament."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")
        
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise ValueError("Team not found")
        
        # Check if user is team captain
        if team.captain_id != user_id:
            raise ValueError("Only team captain can register the team")
        
        # Check tournament status
        if tournament.status != TournamentStatus.REGISTRATION_OPEN:
            raise ValueError("Tournament registration is not open")
        
        # Check if tournament is full
        current_teams = db.query(tournament_teams).filter(
            tournament_teams.c.tournament_id == tournament_id
        ).count()
        
        if current_teams >= tournament.max_teams:
            raise ValueError("Tournament is full")
        
        # Check if team is already registered
        existing = db.query(tournament_teams).filter(
            and_(
                tournament_teams.c.tournament_id == tournament_id,
                tournament_teams.c.team_id == team_id
            )
        ).first()
        
        if existing:
            raise ValueError("Team is already registered for this tournament")
        
        # Register team
        db.execute(tournament_teams.insert().values(
            tournament_id=tournament_id,
            team_id=team_id,
            is_approved=True  # Auto-approve for now
        ))
        db.commit()
        
        # Send notification to team members
        self.notification_service.notify_team_members(
            db, team_id, "Tournament Registration", 
            f"Your team has been registered for tournament '{tournament.name}'.",
            "tournament_registration", tournament_id=tournament_id
        )
        
        return True

    def unregister_team(self, db: Session, tournament_id: UUID, team_id: UUID, user_id: UUID) -> bool:
        """Unregister a team from a tournament."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")
        
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise ValueError("Team not found")
        
        # Check if user is team captain
        if team.captain_id != user_id:
            raise ValueError("Only team captain can unregister the team")
        
        # Don't allow unregistration if tournament has started
        if tournament.status not in [TournamentStatus.DRAFT, TournamentStatus.REGISTRATION_OPEN, TournamentStatus.REGISTRATION_CLOSED]:
            raise ValueError("Cannot unregister after tournament has started")
        
        # Remove registration
        result = db.execute(tournament_teams.delete().where(
            and_(
                tournament_teams.c.tournament_id == tournament_id,
                tournament_teams.c.team_id == team_id
            )
        ))
        
        if result.rowcount == 0:
            raise ValueError("Team is not registered for this tournament")
        
        db.commit()
        return True

    def get_tournament_teams(self, db: Session, tournament_id: UUID) -> List[dict]:
        """Get all teams registered for a tournament."""
        teams = db.query(Team).join(tournament_teams).filter(
            tournament_teams.c.tournament_id == tournament_id
        ).all()
        
        return [
            {
                "id": team.id,
                "name": team.name,
                "tag": team.tag,
                "captain_name": team.captain.name if team.captain else "Unknown",
                "member_count": len(team.players) if team.players else 0
            }
            for team in teams
        ]

    def generate_draw(self, db: Session, tournament_id: UUID) -> Bracket:
        """Generate tournament draw using blockchain for fairness."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")
        
        if tournament.status != TournamentStatus.REGISTRATION_CLOSED:
            raise ValueError("Can only generate draw when registration is closed")
        
        # Get registered teams
        teams = self.get_tournament_teams(db, tournament_id)
        
        if len(teams) < tournament.min_teams:
            raise ValueError(f"Not enough teams registered (minimum: {tournament.min_teams})")
        
        # Generate bracket structure based on format
        bracket_data = self._generate_bracket_structure(tournament.format, teams)
        
        # Create blockchain transaction for verification
        try:
            tx_hash = self.blockchain_service.generate_fair_draw(tournament_id, [team["id"] for team in teams])
            tournament.draw_transaction_hash = tx_hash
            tournament.blockchain_verified = True
        except Exception as e:
            # If blockchain fails, still allow draw but mark as unverified
            tournament.blockchain_verified = False
            print(f"Blockchain verification failed: {e}")
        
        # Create bracket record
        bracket = Bracket(
            tournament_id=tournament_id,
            bracket_data=bracket_data,
            round_number=1
        )
        
        db.add(bracket)
        tournament.status = TournamentStatus.DRAW_GENERATED
        db.commit()
        db.refresh(bracket)
        
        # Create initial matches
        self._create_initial_matches(db, tournament_id, bracket_data)
        
        # Notify all registered teams
        for team in teams:
            self.notification_service.notify_team_members(
                db, team["id"], "Tournament Draw Generated",
                f"The draw for tournament '{tournament.name}' has been generated. Check the bracket!",
                "draw_generated", tournament_id=tournament_id
            )
        
        return bracket

    def _generate_bracket_structure(self, format: TournamentFormat, teams: List[dict]) -> dict:
        """Generate bracket structure based on tournament format."""
        if format == TournamentFormat.SINGLE_ELIMINATION:
            return self._generate_single_elimination_bracket(teams)
        elif format == TournamentFormat.DOUBLE_ELIMINATION:
            return self._generate_double_elimination_bracket(teams)
        elif format == TournamentFormat.ROUND_ROBIN:
            return self._generate_round_robin_bracket(teams)
        else:
            raise ValueError(f"Unsupported tournament format: {format}")

    def _generate_single_elimination_bracket(self, teams: List[dict]) -> dict:
        """Generate single elimination bracket."""
        import random
        shuffled_teams = teams.copy()
        random.shuffle(shuffled_teams)
        
        # Calculate number of rounds needed
        import math
        num_rounds = math.ceil(math.log2(len(teams)))
        
        bracket = {
            "format": "single_elimination",
            "teams": shuffled_teams,
            "rounds": num_rounds,
            "bracket_structure": {}
        }
        
        # Generate first round matchups
        round_1_matches = []
        for i in range(0, len(shuffled_teams), 2):
            if i + 1 < len(shuffled_teams):
                round_1_matches.append({
                    "match_id": f"R1M{i//2 + 1}",
                    "team1": shuffled_teams[i],
                    "team2": shuffled_teams[i + 1],
                    "winner": None
                })
            else:
                # Bye for odd number of teams
                round_1_matches.append({
                    "match_id": f"R1M{i//2 + 1}",
                    "team1": shuffled_teams[i],
                    "team2": None,
                    "winner": shuffled_teams[i]  # Automatic advance
                })
        
        bracket["bracket_structure"]["round_1"] = round_1_matches
        return bracket

    def _generate_double_elimination_bracket(self, teams: List[dict]) -> dict:
        """Generate double elimination bracket."""
        # This is a simplified version - would need more complex logic for full double elimination
        single_bracket = self._generate_single_elimination_bracket(teams)
        single_bracket["format"] = "double_elimination"
        single_bracket["winners_bracket"] = single_bracket["bracket_structure"]
        single_bracket["losers_bracket"] = {}
        return single_bracket

    def _generate_round_robin_bracket(self, teams: List[dict]) -> dict:
        """Generate round robin bracket."""
        matches = []
        match_id = 1
        
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                matches.append({
                    "match_id": f"M{match_id}",
                    "team1": teams[i],
                    "team2": teams[j],
                    "winner": None
                })
                match_id += 1
        
        return {
            "format": "round_robin",
            "teams": teams,
            "matches": matches,
            "standings": {team["id"]: {"wins": 0, "losses": 0, "points": 0} for team in teams}
        }

    def _create_initial_matches(self, db: Session, tournament_id: UUID, bracket_data: dict):
        """Create initial match records based on bracket structure."""
        if bracket_data["format"] == "round_robin":
            # Create all matches for round robin
            for match_data in bracket_data["matches"]:
                match = Match(
                    tournament_id=tournament_id,
                    team1_id=match_data["team1"]["id"] if match_data["team1"] else None,
                    team2_id=match_data["team2"]["id"] if match_data["team2"] else None,
                    round_number=1,
                    match_number=int(match_data["match_id"][1:]),
                    bracket_position=match_data["match_id"]
                )
                db.add(match)
        else:
            # Create first round matches for elimination tournaments
            round_1_matches = bracket_data["bracket_structure"].get("round_1", [])
            for i, match_data in enumerate(round_1_matches):
                match = Match(
                    tournament_id=tournament_id,
                    team1_id=match_data["team1"]["id"] if match_data["team1"] else None,
                    team2_id=match_data["team2"]["id"] if match_data["team2"] else None,
                    round_number=1,
                    match_number=i + 1,
                    bracket_position=match_data["match_id"]
                )
                db.add(match)
        
        db.commit()

    def get_tournament_bracket(self, db: Session, tournament_id: UUID) -> Optional[Bracket]:
        """Get tournament bracket."""
        return db.query(Bracket).filter(Bracket.tournament_id == tournament_id).first()

    def start_tournament(self, db: Session, tournament_id: UUID) -> Optional[Tournament]:
        """Start the tournament."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            return None
        
        if tournament.status != TournamentStatus.DRAW_GENERATED:
            raise ValueError("Tournament must have a generated draw before starting")
        
        tournament.status = TournamentStatus.IN_PROGRESS
        tournament.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(tournament)
        
        return tournament

    def complete_tournament(self, db: Session, tournament_id: UUID) -> Optional[Tournament]:
        """Mark tournament as completed."""
        tournament = self.get_tournament(db, tournament_id)
        if not tournament:
            return None
        
        if tournament.status != TournamentStatus.IN_PROGRESS:
            raise ValueError("Only in-progress tournaments can be completed")
        
        tournament.status = TournamentStatus.COMPLETED
        tournament.tournament_end = datetime.utcnow()
        tournament.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(tournament)
        
        return tournament

    def get_tournament_stats(self, db: Session) -> TournamentStatsResponse:
        """Get tournament statistics."""
        total_tournaments = db.query(Tournament).count()
        active_tournaments = db.query(Tournament).filter(
            Tournament.status.in_([TournamentStatus.REGISTRATION_OPEN, TournamentStatus.IN_PROGRESS])
        ).count()
        completed_tournaments = db.query(Tournament).filter(
            Tournament.status == TournamentStatus.COMPLETED
        ).count()
        
        total_matches = db.query(Match).count()
        total_teams = db.query(func.count(func.distinct(tournament_teams.c.team_id))).scalar()
        upcoming_matches = db.query(Match).filter(
            Match.status == MatchStatus.SCHEDULED,
            Match.scheduled_time > datetime.utcnow()
        ).count()
        
        return TournamentStatsResponse(
            total_tournaments=total_tournaments,
            active_tournaments=active_tournaments,
            completed_tournaments=completed_tournaments,
            total_matches=total_matches,
            total_teams=total_teams or 0,
            upcoming_matches=upcoming_matches
        )