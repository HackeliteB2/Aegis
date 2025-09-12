from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.models.team import Team, TeamStatus, team_members
from app.models.user import User
from app.models.tournament import tournament_teams, Tournament
from app.models.match import Match, MatchStatus
from app.schemas.team import TeamCreate, TeamUpdate, TeamStatsResponse
from app.services.notification_service import NotificationService


class TeamService:
    def __init__(self):
        self.notification_service = NotificationService()

    def create_team(self, db: Session, team_data: TeamCreate, captain_id: UUID) -> dict:
        """Create a new team with the user as captain."""
        
        # Check if user is already captain of another team
        existing_captaincy = db.query(Team).filter(Team.captain_id == captain_id).first()
        if existing_captaincy:
            raise ValueError("You are already captain of another team. You can only captain one team at a time.")
        
        # Check if team name or tag already exists
        existing_name = db.query(Team).filter(Team.name == team_data.name).first()
        if existing_name:
            raise ValueError("Team name already exists")
        
        existing_tag = db.query(Team).filter(Team.tag == team_data.tag.upper()).first()
        if existing_tag:
            raise ValueError("Team tag already exists")
        
        # Create team
        team_dict = team_data.dict()
        team_dict['tag'] = team_data.tag.upper()  # Override tag with uppercase
        team_dict['captain_id'] = captain_id
        
        team = Team(**team_dict)
        
        db.add(team)
        db.commit()
        db.refresh(team)
        
        # Add captain as team member
        db.execute(team_members.insert().values(
            team_id=team.id,
            user_id=captain_id,
            role="captain",
            is_active=True
        ))
        db.commit()
        
        # Send notification to captain
        self.notification_service.create_notification(
            db, captain_id, "Team Created",
            f"Your team '{team.name}' has been created successfully!",
            "team_created", team_id=team.id
        )
        
        # Get captain info and return formatted response
        db.refresh(team)  # Ensure relationships are loaded
        captain_name = team.captain.name if team.captain else "Unknown"
        
        # Calculate member count (should be 1 - just the captain)
        member_count = db.query(team_members).filter(
            team_members.c.team_id == team.id,
            team_members.c.is_active == True
        ).count()
        
        # Calculate win rate
        total_games = team.wins + team.losses + team.draws
        win_rate = (team.wins / total_games * 100) if total_games > 0 else 0.0
        
        return {
            "id": team.id,
            "name": team.name,
            "tag": team.tag,
            "description": team.description,
            "logo_url": team.logo_url,
            "contact_email": team.contact_email,
            "discord_server": team.discord_server,
            "status": team.status,
            "captain_id": team.captain_id,
            "captain_name": captain_name,
            "is_verified": team.is_verified,
            "wins": team.wins,
            "losses": team.losses,
            "draws": team.draws,
            "win_rate": round(win_rate, 2),
            "member_count": member_count,
            "created_at": team.created_at,
            "updated_at": team.updated_at
        }

    def get_team(self, db: Session, team_id: UUID) -> Optional[Team]:
        """Get team by ID."""
        return db.query(Team).filter(Team.id == team_id).first()

    def get_team_with_members(self, db: Session, team_id: UUID) -> Optional[dict]:
        """Get team with detailed member information."""
        team = self.get_team(db, team_id)
        if not team:
            return None
        
        # Get team members with their roles
        members_query = db.query(User, team_members.c.role, team_members.c.joined_date, team_members.c.is_active).join(
            team_members, User.id == team_members.c.user_id
        ).filter(team_members.c.team_id == team_id)
        
        members = []
        for user, role, joined_date, is_active in members_query.all():
            members.append({
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "role": role,
                "joined_date": joined_date,
                "is_active": is_active
            })
        
        # Calculate win rate
        total_games = team.wins + team.losses + team.draws
        win_rate = (team.wins / total_games * 100) if total_games > 0 else 0.0
        
        return {
            **team.__dict__,
            "captain_name": team.captain.name if team.captain else "Unknown",
            "members": members,
            "member_count": len([m for m in members if m["is_active"]]),
            "win_rate": round(win_rate, 2)
        }

    def get_teams(
        self, db: Session, skip: int = 0, limit: int = 100,
        status_filter: Optional[TeamStatus] = None,
        search: Optional[str] = None,
        verified_only: Optional[bool] = None
    ) -> List[dict]:
        """Get teams with optional filters."""
        query = db.query(Team)
        
        # Apply filters
        if status_filter:
            query = query.filter(Team.status == status_filter)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Team.name.ilike(search_term),
                    Team.tag.ilike(search_term)
                )
            )
        
        if verified_only is not None:
            query = query.filter(Team.is_verified == verified_only)
        
        teams = query.offset(skip).limit(limit).all()
        
        # Format response with additional data
        result = []
        for team in teams:
            # Get member count
            member_count = db.query(team_members).filter(
                team_members.c.team_id == team.id,
                team_members.c.is_active == True
            ).count()
            
            # Calculate win rate
            total_games = team.wins + team.losses + team.draws
            win_rate = (team.wins / total_games * 100) if total_games > 0 else 0.0
            
            result.append({
                "id": team.id,
                "name": team.name,
                "tag": team.tag,
                "captain_name": team.captain.name if team.captain else "Unknown",
                "member_count": member_count,
                "wins": team.wins,
                "losses": team.losses,
                "draws": team.draws,
                "win_rate": round(win_rate, 2),
                "status": team.status,
                "is_verified": team.is_verified,
                "created_at": team.created_at
            })
        
        return result

    def update_team(self, db: Session, team_id: UUID, team_data: TeamUpdate) -> Optional[Team]:
        """Update team details."""
        team = self.get_team(db, team_id)
        if not team:
            return None
        
        # Check for duplicate name/tag if being updated
        update_data = team_data.dict(exclude_unset=True)
        
        if "name" in update_data and update_data["name"] != team.name:
            existing_name = db.query(Team).filter(
                Team.name == update_data["name"],
                Team.id != team_id
            ).first()
            if existing_name:
                raise ValueError("Team name already exists")
        
        if "tag" in update_data and update_data["tag"].upper() != team.tag:
            existing_tag = db.query(Team).filter(
                Team.tag == update_data["tag"].upper(),
                Team.id != team_id
            ).first()
            if existing_tag:
                raise ValueError("Team tag already exists")
        
        # Update fields
        for field, value in update_data.items():
            if field == "tag" and value:
                setattr(team, field, value.upper())
            else:
                setattr(team, field, value)
        
        team.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(team)
        return team

    def delete_team(self, db: Session, team_id: UUID) -> bool:
        """Delete team and all related data."""
        team = self.get_team(db, team_id)
        if not team:
            return False
        
        # Check if team is in any active tournaments
        active_tournaments = db.query(tournament_teams).join(Tournament).filter(
            tournament_teams.c.team_id == team_id,
            Tournament.status.in_(["registration_open", "in_progress"])
        ).count()
        
        if active_tournaments > 0:
            raise ValueError("Cannot delete team while participating in active tournaments")
        
        # Remove team members
        db.execute(team_members.delete().where(team_members.c.team_id == team_id))
        
        # Remove tournament registrations
        db.execute(tournament_teams.delete().where(tournament_teams.c.team_id == team_id))
        
        # Delete team
        db.delete(team)
        db.commit()
        return True

    def invite_player(self, db: Session, team_id: UUID, user_id: UUID, role: str = "player") -> bool:
        """Invite a player to join the team."""
        team = self.get_team(db, team_id)
        if not team:
            raise ValueError("Team not found")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Check if user is already a member
        existing_membership = db.query(team_members).filter(
            team_members.c.team_id == team_id,
            team_members.c.user_id == user_id
        ).first()
        
        if existing_membership:
            raise ValueError("User is already a member of this team")
        
        # Check team capacity (assuming max 10 members)
        current_members = db.query(team_members).filter(
            team_members.c.team_id == team_id,
            team_members.c.is_active == True
        ).count()
        
        if current_members >= 10:
            raise ValueError("Team is full")
        
        # Add member with inactive status (pending acceptance)
        db.execute(team_members.insert().values(
            team_id=team_id,
            user_id=user_id,
            role=role,
            is_active=False  # Pending acceptance
        ))
        db.commit()
        
        # Send notification to invited user
        self.notification_service.create_notification(
            db, user_id, "Team Invitation",
            f"You have been invited to join team '{team.name}' as a {role}.",
            "team_invitation", team_id=team_id
        )
        
        return True

    def accept_invitation(self, db: Session, team_id: UUID, user_id: UUID) -> bool:
        """Accept team invitation."""
        # Find pending invitation
        invitation = db.query(team_members).filter(
            team_members.c.team_id == team_id,
            team_members.c.user_id == user_id,
            team_members.c.is_active == False
        ).first()
        
        if not invitation:
            return False
        
        # Activate membership
        db.execute(team_members.update().where(
            and_(
                team_members.c.team_id == team_id,
                team_members.c.user_id == user_id
            )
        ).values(is_active=True))
        db.commit()
        
        # Notify team captain
        team = self.get_team(db, team_id)
        if team and team.captain:
            user = db.query(User).filter(User.id == user_id).first()
            self.notification_service.create_notification(
                db, team.captain_id, "Player Joined",
                f"{user.name} has joined your team '{team.name}'.",
                "player_joined", team_id=team_id
            )
        
        return True

    def remove_member(self, db: Session, team_id: UUID, user_id: UUID) -> bool:
        """Remove a member from the team."""
        result = db.execute(team_members.delete().where(
            and_(
                team_members.c.team_id == team_id,
                team_members.c.user_id == user_id
            )
        ))
        
        db.commit()
        return result.rowcount > 0

    def transfer_captaincy(self, db: Session, team_id: UUID, new_captain_id: UUID) -> bool:
        """Transfer team captaincy to another member."""
        team = self.get_team(db, team_id)
        if not team:
            return False
        
        # Check if new captain is a team member
        membership = db.query(team_members).filter(
            team_members.c.team_id == team_id,
            team_members.c.user_id == new_captain_id,
            team_members.c.is_active == True
        ).first()
        
        if not membership:
            raise ValueError("New captain must be an active team member")
        
        old_captain_id = team.captain_id
        
        # Update team captain
        team.captain_id = new_captain_id
        team.updated_at = datetime.utcnow()
        
        # Update member roles
        db.execute(team_members.update().where(
            and_(
                team_members.c.team_id == team_id,
                team_members.c.user_id == old_captain_id
            )
        ).values(role="player"))
        
        db.execute(team_members.update().where(
            and_(
                team_members.c.team_id == team_id,
                team_members.c.user_id == new_captain_id
            )
        ).values(role="captain"))
        
        db.commit()
        
        # Send notifications
        new_captain = db.query(User).filter(User.id == new_captain_id).first()
        self.notification_service.create_notification(
            db, new_captain_id, "Captaincy Transferred",
            f"You are now the captain of team '{team.name}'.",
            "captaincy_received", team_id=team_id
        )
        
        return True

    def get_team_tournaments(self, db: Session, team_id: UUID) -> List[dict]:
        """Get tournaments this team is participating in."""
        tournaments = db.query(Tournament).join(tournament_teams).filter(
            tournament_teams.c.team_id == team_id
        ).all()
        
        return [
            {
                "id": tournament.id,
                "name": tournament.name,
                "game_title": tournament.game_title,
                "status": tournament.status,
                "tournament_start": tournament.tournament_start,
                "format": tournament.format
            }
            for tournament in tournaments
        ]

    def get_team_matches(self, db: Session, team_id: UUID, limit: int = 20) -> List[dict]:
        """Get recent matches for this team."""
        matches = db.query(Match).filter(
            or_(Match.team1_id == team_id, Match.team2_id == team_id)
        ).order_by(desc(Match.created_at)).limit(limit).all()
        
        result = []
        for match in matches:
            opponent_team = None
            if match.team1_id == team_id and match.team2:
                opponent_team = {"id": match.team2.id, "name": match.team2.name, "tag": match.team2.tag}
            elif match.team2_id == team_id and match.team1:
                opponent_team = {"id": match.team1.id, "name": match.team1.name, "tag": match.team1.tag}
            
            result.append({
                "id": match.id,
                "tournament_name": match.tournament.name if match.tournament else "Unknown",
                "opponent": opponent_team,
                "status": match.status,
                "team_score": match.team1_score if match.team1_id == team_id else match.team2_score,
                "opponent_score": match.team2_score if match.team1_id == team_id else match.team1_score,
                "scheduled_time": match.scheduled_time,
                "created_at": match.created_at
            })
        
        return result

    def get_team_statistics(self, db: Session, team_id: UUID) -> Optional[dict]:
        """Get detailed team statistics."""
        team = self.get_team(db, team_id)
        if not team:
            return None
        
        # Get match statistics
        total_matches = db.query(Match).filter(
            or_(Match.team1_id == team_id, Match.team2_id == team_id),
            Match.status == MatchStatus.COMPLETED
        ).count()
        
        wins = db.query(Match).filter(
            Match.winner_id == team_id
        ).count()
        
        losses = total_matches - wins - team.draws
        
        # Get recent form (last 10 matches)
        recent_matches = db.query(Match).filter(
            or_(Match.team1_id == team_id, Match.team2_id == team_id),
            Match.status == MatchStatus.COMPLETED
        ).order_by(desc(Match.actual_end_time)).limit(10).all()
        
        recent_form = []
        for match in recent_matches:
            if match.winner_id == team_id:
                recent_form.append("W")
            elif match.winner_id is None:
                recent_form.append("D")
            else:
                recent_form.append("L")
        
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0
        
        return {
            "id": team.id,
            "name": team.name,
            "tag": team.tag,
            "total_matches": total_matches,
            "wins": wins,
            "losses": losses,
            "draws": team.draws,
            "win_rate": round(win_rate, 2),
            "recent_form": recent_form,
            "tournaments_participated": len(self.get_team_tournaments(db, team_id)),
            "created_at": team.created_at,
            "is_verified": team.is_verified
        }

    def get_user_teams(self, db: Session, user_id: UUID) -> List[dict]:
        """Get teams where user is a member."""
        teams_query = db.query(Team, team_members.c.role).join(team_members).filter(
            team_members.c.user_id == user_id,
            team_members.c.is_active == True
        ).all()
        
        result = []
        for team, role in teams_query:
            member_count = db.query(team_members).filter(
                team_members.c.team_id == team.id,
                team_members.c.is_active == True
            ).count()
            
            total_games = team.wins + team.losses + team.draws
            win_rate = (team.wins / total_games * 100) if total_games > 0 else 0.0
            
            result.append({
                "id": team.id,
                "name": team.name,
                "tag": team.tag,
                "captain_name": team.captain.name if team.captain else "Unknown",
                "user_role": role,
                "member_count": member_count,
                "wins": team.wins,
                "losses": team.losses,
                "draws": team.draws,
                "win_rate": round(win_rate, 2),
                "status": team.status,
                "is_verified": team.is_verified,
                "created_at": team.created_at
            })
        
        return result

    def verify_team(self, db: Session, team_id: UUID) -> bool:
        """Verify a team (admin action)."""
        team = self.get_team(db, team_id)
        if not team:
            return False
        
        team.is_verified = True
        team.updated_at = datetime.utcnow()
        db.commit()
        
        # Notify team captain
        self.notification_service.create_notification(
            db, team.captain_id, "Team Verified",
            f"Your team '{team.name}' has been verified!",
            "team_verified", team_id=team_id
        )
        
        return True

    def unverify_team(self, db: Session, team_id: UUID) -> bool:
        """Remove verification from a team."""
        team = self.get_team(db, team_id)
        if not team:
            return False
        
        team.is_verified = False
        team.updated_at = datetime.utcnow()
        db.commit()
        return True

    def search_teams(self, db: Session, query: str, limit: int = 10) -> List[dict]:
        """Search teams by name or tag."""
        search_term = f"%{query}%"
        
        teams = db.query(Team).filter(
            or_(
                Team.name.ilike(search_term),
                Team.tag.ilike(search_term)
            ),
            Team.status == TeamStatus.ACTIVE
        ).limit(limit).all()
        
        result = []
        for team in teams:
            member_count = db.query(team_members).filter(
                team_members.c.team_id == team.id,
                team_members.c.is_active == True
            ).count()
            
            result.append({
                "id": team.id,
                "name": team.name,
                "tag": team.tag,
                "captain_name": team.captain.name if team.captain else "Unknown",
                "member_count": member_count,
                "is_verified": team.is_verified
            })
        
        return result

    def get_team_stats(self, db: Session) -> TeamStatsResponse:
        """Get overall team statistics."""
        total_teams = db.query(Team).count()
        verified_teams = db.query(Team).filter(Team.is_verified == True).count()
        active_teams = db.query(Team).filter(Team.status == TeamStatus.ACTIVE).count()
        
        # Simplified count for teams in tournaments
        teams_in_tournaments = db.query(tournament_teams).distinct(tournament_teams.c.team_id).count()
        
        # Simplified average team size calculation
        total_active_members = db.query(team_members).filter(
            team_members.c.is_active == True
        ).count()
        
        avg_team_size = round(total_active_members / total_teams, 2) if total_teams > 0 else 0.0
        
        return TeamStatsResponse(
            total_teams=total_teams,
            verified_teams=verified_teams,
            active_teams=active_teams,
            teams_in_tournaments=teams_in_tournaments or 0,
            average_team_size=avg_team_size
        )