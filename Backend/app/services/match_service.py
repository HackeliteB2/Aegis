from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.models.match import Match, MatchStatus, GameResult, Notification
from app.models.tournament import Tournament, Bracket
from app.models.team import Team
from app.models.user import User
from app.schemas.match import MatchCreate, MatchUpdate, MatchResultSubmission, GameResultCreate, MatchStatsResponse
from app.services.notification_service import NotificationService
from app.services.gemini_service import GeminiService


class MatchService:
    def __init__(self):
        self.notification_service = NotificationService()
        self.gemini_service = GeminiService()

    def create_match(self, db: Session, match_data: MatchCreate, creator_id: UUID) -> Match:
        """Create a new match."""
        # Validate tournament exists
        tournament = db.query(Tournament).filter(Tournament.id == match_data.tournament_id).first()
        if not tournament:
            raise ValueError("Tournament not found")
        
        # Validate teams exist if provided
        if match_data.team1_id:
            team1 = db.query(Team).filter(Team.id == match_data.team1_id).first()
            if not team1:
                raise ValueError("Team 1 not found")
        
        if match_data.team2_id:
            team2 = db.query(Team).filter(Team.id == match_data.team2_id).first()
            if not team2:
                raise ValueError("Team 2 not found")
        
        # Check for duplicate matches
        if match_data.team1_id and match_data.team2_id:
            existing = db.query(Match).filter(
                Match.tournament_id == match_data.tournament_id,
                Match.round_number == match_data.round_number,
                or_(
                    and_(Match.team1_id == match_data.team1_id, Match.team2_id == match_data.team2_id),
                    and_(Match.team1_id == match_data.team2_id, Match.team2_id == match_data.team1_id)
                )
            ).first()
            
            if existing:
                raise ValueError("Match between these teams already exists in this round")
        
        match = Match(**match_data.dict())
        db.add(match)
        db.commit()
        db.refresh(match)
        
        # Create notifications for teams
        self.notification_service.create_match_notifications(
            db, match.id, "match_scheduled",
            f"New match scheduled for {match.scheduled_time or 'TBD'}"
        )
        
        return match

    def get_match(self, db: Session, match_id: UUID) -> Optional[Match]:
        """Get match by ID."""
        return db.query(Match).filter(Match.id == match_id).first()

    def get_match_detail(self, db: Session, match_id: UUID) -> Optional[dict]:
        """Get detailed match information including game results."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        # Get game results
        game_results = db.query(GameResult).filter(GameResult.match_id == match_id).order_by(GameResult.game_number).all()
        
        return {
            **match.__dict__,
            "team1": {"id": match.team1.id, "name": match.team1.name, "tag": match.team1.tag} if match.team1 else None,
            "team2": {"id": match.team2.id, "name": match.team2.name, "tag": match.team2.tag} if match.team2 else None,
            "winner": {"id": match.winner.id, "name": match.winner.name, "tag": match.winner.tag} if match.winner else None,
            "game_results": [
                {
                    "id": gr.id,
                    "game_number": gr.game_number,
                    "map_played": gr.map_played,
                    "team1_score": gr.team1_score,
                    "team2_score": gr.team2_score,
                    "winner_id": gr.winner_id,
                    "winner_name": gr.winner.name if gr.winner else None,
                    "duration_minutes": gr.duration_minutes,
                    "game_details": gr.game_details,
                    "created_at": gr.created_at
                }
                for gr in game_results
            ]
        }

    def get_matches(
        self, db: Session, skip: int = 0, limit: int = 100,
        tournament_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        status_filter: Optional[MatchStatus] = None
    ) -> List[dict]:
        """Get matches with optional filters."""
        query = db.query(Match)
        
        # Apply filters
        if tournament_id:
            query = query.filter(Match.tournament_id == tournament_id)
        
        if team_id:
            query = query.filter(or_(Match.team1_id == team_id, Match.team2_id == team_id))
        
        if status_filter:
            query = query.filter(Match.status == status_filter)
        
        matches = query.order_by(desc(Match.scheduled_time)).offset(skip).limit(limit).all()
        
        # Format response
        result = []
        for match in matches:
            result.append({
                "id": match.id,
                "tournament_name": match.tournament.name if match.tournament else "Unknown",
                "team1_name": match.team1.name if match.team1 else None,
                "team1_tag": match.team1.tag if match.team1 else None,
                "team2_name": match.team2.name if match.team2 else None,
                "team2_tag": match.team2.tag if match.team2 else None,
                "round_number": match.round_number,
                "match_number": match.match_number,
                "status": match.status,
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "winner_name": match.winner.name if match.winner else None,
                "scheduled_time": match.scheduled_time,
                "actual_start_time": match.actual_start_time,
                "created_at": match.created_at
            })
        
        return result

    def update_match(self, db: Session, match_id: UUID, match_data: MatchUpdate, updater_id: UUID) -> Optional[Match]:
        """Update match details."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        # Don't allow updates to completed matches
        if match.status == MatchStatus.COMPLETED:
            raise ValueError("Cannot update completed matches")
        
        # Update fields
        update_data = match_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(match, field, value)
        
        match.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(match)
        
        # Notify teams of changes
        self.notification_service.create_match_notifications(
            db, match.id, "match_updated",
            "Match details have been updated. Please check the latest information."
        )
        
        return match

    def submit_result(self, db: Session, match_id: UUID, result_data: MatchResultSubmission, reporter_id: UUID) -> Optional[Match]:
        """Submit match results."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        # Validate reporter is team captain
        reporter = db.query(User).filter(User.id == reporter_id).first()
        if not reporter:
            raise ValueError("Reporter not found")
        
        # Check if reporter is captain of one of the teams
        is_captain = False
        if match.team1 and match.team1.captain_id == reporter_id:
            is_captain = True
        elif match.team2 and match.team2.captain_id == reporter_id:
            is_captain = True
        elif reporter.role.value == "admin":
            is_captain = True
        
        if not is_captain:
            raise ValueError("Only team captains or admins can submit match results")
        
        # Update match with results
        match.team1_score = result_data.team1_score
        match.team2_score = result_data.team2_score
        match.winner_id = result_data.winner_id
        match.status = MatchStatus.COMPLETED
        match.actual_end_time = datetime.utcnow()
        match.reported_by_id = reporter_id
        match.notes = result_data.notes
        match.selected_maps = result_data.selected_maps
        
        # Update team statistics
        if match.winner_id:
            winner = db.query(Team).filter(Team.id == match.winner_id).first()
            loser = None
            
            if match.team1_id == match.winner_id:
                loser = match.team2
            else:
                loser = match.team1
            
            if winner:
                winner.wins += 1
            if loser:
                loser.losses += 1
        else:
            # Draw
            if match.team1:
                match.team1.draws += 1
            if match.team2:
                match.team2.draws += 1
        
        db.commit()
        db.refresh(match)
        
        # Add game results if provided
        if result_data.game_results:
            for game_data in result_data.game_results:
                game_result = GameResult(
                    match_id=match.id,
                    game_number=game_data.get("game_number", 1),
                    map_played=game_data.get("map_played"),
                    team1_score=game_data.get("team1_score", 0),
                    team2_score=game_data.get("team2_score", 0),
                    winner_id=game_data.get("winner_id"),
                    duration_minutes=game_data.get("duration_minutes"),
                    game_details=game_data.get("game_details")
                )
                db.add(game_result)
        
        db.commit()
        
        # Generate AI summary
        try:
            self.generate_ai_summary(db, match_id)
        except Exception as e:
            print(f"Failed to generate AI summary: {e}")
        
        # Notify teams
        self.notification_service.create_match_notifications(
            db, match.id, "match_completed",
            "Match has been completed. Check the results!"
        )
        
        # Update tournament bracket if needed
        self._update_tournament_bracket(db, match)
        
        return match

    def verify_result(self, db: Session, match_id: UUID, verifier_id: UUID) -> Optional[Match]:
        """Verify match results (admin only)."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        match.is_verified = True
        match.verified_by_id = verifier_id
        match.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(match)
        
        # Notify teams
        self.notification_service.create_match_notifications(
            db, match.id, "result_verified",
            "Match results have been officially verified."
        )
        
        return match

    def dispute_result(self, db: Session, match_id: UUID, disputer_id: UUID, reason: str) -> bool:
        """Dispute match results."""
        match = self.get_match(db, match_id)
        if not match:
            return False
        
        # Validate disputer is team captain
        disputer = db.query(User).filter(User.id == disputer_id).first()
        if not disputer:
            raise ValueError("Disputer not found")
        
        is_captain = False
        if match.team1 and match.team1.captain_id == disputer_id:
            is_captain = True
        elif match.team2 and match.team2.captain_id == disputer_id:
            is_captain = True
        
        if not is_captain:
            raise ValueError("Only team captains can dispute results")
        
        match.status = MatchStatus.DISPUTED
        match.admin_notes = f"Disputed by {disputer.name}: {reason}"
        match.updated_at = datetime.utcnow()
        db.commit()
        
        # Notify admins
        admins = db.query(User).filter(User.role.value == "admin").all()
        for admin in admins:
            self.notification_service.create_notification(
                db, admin.id, "Match Disputed",
                f"Match {match.id} has been disputed. Reason: {reason}",
                "match_disputed", match_id=match_id
            )
        
        return True

    def start_match(self, db: Session, match_id: UUID) -> Optional[Match]:
        """Start a match."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        if match.status != MatchStatus.SCHEDULED:
            raise ValueError("Only scheduled matches can be started")
        
        match.status = MatchStatus.IN_PROGRESS
        match.actual_start_time = datetime.utcnow()
        match.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(match)
        
        # Notify teams
        self.notification_service.create_match_notifications(
            db, match.id, "match_started",
            "Your match has started! Good luck!"
        )
        
        return match

    def reschedule_match(self, db: Session, match_id: UUID, new_time: datetime) -> Optional[Match]:
        """Reschedule a match."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        if match.status in [MatchStatus.COMPLETED, MatchStatus.IN_PROGRESS]:
            raise ValueError("Cannot reschedule completed or in-progress matches")
        
        old_time = match.scheduled_time
        match.scheduled_time = new_time
        match.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(match)
        
        # Notify teams
        self.notification_service.create_match_notifications(
            db, match.id, "match_rescheduled",
            f"Match has been rescheduled from {old_time} to {new_time}"
        )
        
        return match

    def generate_ai_summary(self, db: Session, match_id: UUID) -> Optional[Match]:
        """Generate AI summary for completed match."""
        match = self.get_match(db, match_id)
        if not match:
            return None
        
        if match.status != MatchStatus.COMPLETED:
            raise ValueError("Can only generate summaries for completed matches")
        
        try:
            # Prepare match data for AI
            match_data = {
                "team1": match.team1.name if match.team1 else "TBD",
                "team2": match.team2.name if match.team2 else "TBD",
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "winner": match.winner.name if match.winner else "Draw",
                "tournament": match.tournament.name if match.tournament else "Unknown",
                "maps": match.selected_maps or [],
                "duration": None
            }
            
            if match.actual_start_time and match.actual_end_time:
                duration = match.actual_end_time - match.actual_start_time
                match_data["duration"] = str(duration)
            
            # Get game results
            game_results = db.query(GameResult).filter(GameResult.match_id == match_id).all()
            match_data["game_results"] = [
                {
                    "game": gr.game_number,
                    "map": gr.map_played,
                    "team1_score": gr.team1_score,
                    "team2_score": gr.team2_score,
                    "winner": gr.winner.name if gr.winner else "Draw"
                }
                for gr in game_results
            ]
            
            # Generate summary using Gemini
            summary = self.gemini_service.generate_match_summary(match_data)
            
            match.ai_summary = summary
            match.summary_generated_at = datetime.utcnow()
            match.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(match)
            
            return match
            
        except Exception as e:
            print(f"Failed to generate AI summary: {e}")
            raise ValueError("Failed to generate match summary")

    def add_game_result(self, db: Session, match_id: UUID, game_result: GameResultCreate, reporter_id: UUID) -> GameResult:
        """Add individual game result to a match."""
        match = self.get_match(db, match_id)
        if not match:
            raise ValueError("Match not found")
        
        # Validate reporter permissions (similar to submit_result)
        reporter = db.query(User).filter(User.id == reporter_id).first()
        if not reporter:
            raise ValueError("Reporter not found")
        
        is_authorized = False
        if match.team1 and match.team1.captain_id == reporter_id:
            is_authorized = True
        elif match.team2 and match.team2.captain_id == reporter_id:
            is_authorized = True
        elif reporter.role.value in ["admin", "organizer"]:
            is_authorized = True
        
        if not is_authorized:
            raise ValueError("Not authorized to add game results")
        
        # Create game result
        result = GameResult(
            match_id=match_id,
            **game_result.dict()
        )
        
        db.add(result)
        db.commit()
        db.refresh(result)
        
        return result

    def get_game_results(self, db: Session, match_id: UUID) -> List[dict]:
        """Get all game results for a match."""
        results = db.query(GameResult).filter(GameResult.match_id == match_id).order_by(GameResult.game_number).all()
        
        return [
            {
                "id": result.id,
                "match_id": result.match_id,
                "game_number": result.game_number,
                "map_played": result.map_played,
                "team1_score": result.team1_score,
                "team2_score": result.team2_score,
                "winner_id": result.winner_id,
                "winner_name": result.winner.name if result.winner else None,
                "duration_minutes": result.duration_minutes,
                "game_details": result.game_details,
                "created_at": result.created_at
            }
            for result in results
        ]

    def get_upcoming_matches(self, db: Session, hours: int = 24, limit: int = 50) -> List[dict]:
        """Get upcoming matches in the next X hours."""
        cutoff_time = datetime.utcnow() + timedelta(hours=hours)
        
        matches = db.query(Match).filter(
            Match.scheduled_time <= cutoff_time,
            Match.scheduled_time >= datetime.utcnow(),
            Match.status == MatchStatus.SCHEDULED
        ).order_by(asc(Match.scheduled_time)).limit(limit).all()
        
        return self._format_match_list(matches)

    def get_live_matches(self, db: Session) -> List[dict]:
        """Get currently live matches."""
        matches = db.query(Match).filter(
            Match.status == MatchStatus.IN_PROGRESS
        ).order_by(desc(Match.actual_start_time)).all()
        
        return self._format_match_list(matches)

    def get_recent_matches(self, db: Session, days: int = 7, limit: int = 50) -> List[dict]:
        """Get recently completed matches."""
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        matches = db.query(Match).filter(
            Match.actual_end_time >= cutoff_time,
            Match.status == MatchStatus.COMPLETED
        ).order_by(desc(Match.actual_end_time)).limit(limit).all()
        
        return self._format_match_list(matches)

    def get_tournament_bracket_with_results(self, db: Session, tournament_id: UUID) -> Optional[dict]:
        """Get tournament bracket with current match results."""
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            return None
        
        bracket = db.query(Bracket).filter(Bracket.tournament_id == tournament_id).first()
        if not bracket:
            return None
        
        # Get all matches for the tournament
        matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
        
        # Add match results to bracket data
        bracket_data = bracket.bracket_data.copy()
        bracket_data["matches"] = {}
        
        for match in matches:
            bracket_data["matches"][str(match.id)] = {
                "id": match.id,
                "team1": {"id": match.team1.id, "name": match.team1.name} if match.team1 else None,
                "team2": {"id": match.team2.id, "name": match.team2.name} if match.team2 else None,
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "winner_id": match.winner_id,
                "status": match.status,
                "scheduled_time": match.scheduled_time,
                "round_number": match.round_number,
                "match_number": match.match_number,
                "bracket_position": match.bracket_position
            }
        
        return {
            "tournament_id": tournament_id,
            "tournament_name": tournament.name,
            "bracket_id": bracket.id,
            "bracket_data": bracket_data,
            "last_updated": bracket.updated_at or bracket.created_at
        }

    def get_match_stats(self, db: Session) -> MatchStatsResponse:
        """Get match statistics overview."""
        total_matches = db.query(Match).count()
        completed_matches = db.query(Match).filter(Match.status == MatchStatus.COMPLETED).count()
        scheduled_matches = db.query(Match).filter(Match.status == MatchStatus.SCHEDULED).count()
        in_progress_matches = db.query(Match).filter(Match.status == MatchStatus.IN_PROGRESS).count()
        
        # Matches today
        today = datetime.utcnow().date()
        matches_today = db.query(Match).filter(
            func.date(Match.scheduled_time) == today
        ).count()
        
        # Average match duration (for completed matches with both start and end times)
        avg_duration_result = db.query(
            func.avg(
                func.extract('epoch', Match.actual_end_time - Match.actual_start_time) / 60
            )
        ).filter(
            Match.status == MatchStatus.COMPLETED,
            Match.actual_start_time.isnot(None),
            Match.actual_end_time.isnot(None)
        ).scalar()
        
        avg_duration = round(avg_duration_result or 0, 2)
        
        return MatchStatsResponse(
            total_matches=total_matches,
            completed_matches=completed_matches,
            scheduled_matches=scheduled_matches,
            in_progress_matches=in_progress_matches,
            matches_today=matches_today,
            average_match_duration=avg_duration
        )

    def _format_match_list(self, matches: List[Match]) -> List[dict]:
        """Format matches for list response."""
        result = []
        for match in matches:
            result.append({
                "id": match.id,
                "tournament_name": match.tournament.name if match.tournament else "Unknown",
                "team1_name": match.team1.name if match.team1 else None,
                "team1_tag": match.team1.tag if match.team1 else None,
                "team2_name": match.team2.name if match.team2 else None,
                "team2_tag": match.team2.tag if match.team2 else None,
                "round_number": match.round_number,
                "match_number": match.match_number,
                "status": match.status,
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "winner_name": match.winner.name if match.winner else None,
                "scheduled_time": match.scheduled_time,
                "actual_start_time": match.actual_start_time,
                "created_at": match.created_at
            })
        return result

    def _update_tournament_bracket(self, db: Session, match: Match):
        """Update tournament bracket after match completion."""
        if not match.winner_id or match.tournament.format.value == "round_robin":
            return
        
        bracket = db.query(Bracket).filter(Bracket.tournament_id == match.tournament_id).first()
        if not bracket:
            return
        
        try:
            # Update bracket data with match result
            bracket_data = bracket.bracket_data.copy()
            
            # Find and update the match in bracket structure
            if "bracket_structure" in bracket_data:
                for round_key, round_matches in bracket_data["bracket_structure"].items():
                    for match_data in round_matches:
                        if match_data.get("match_id") == match.bracket_position:
                            match_data["winner"] = {
                                "id": match.winner.id,
                                "name": match.winner.name,
                                "tag": match.winner.tag
                            } if match.winner else None
                            break
            
            bracket.bracket_data = bracket_data
            bracket.updated_at = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            print(f"Failed to update bracket: {e}")
            # Don't fail the match submission if bracket update fails