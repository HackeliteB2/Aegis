from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
from datetime import datetime

from app.core.config import settings
from app.models.user import User
from app.models.team import Team, team_members
from app.models.match import Notification
from app.schemas.match import NotificationCreate


class NotificationService:
    """Service for managing user notifications and email sending."""
    
    def __init__(self):
        self.sendgrid_api_key = settings.SENDGRID_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.sendgrid_enabled = bool(self.sendgrid_api_key and self.sendgrid_api_key != "your-sendgrid-api-key")
        
        if self.sendgrid_enabled:
            try:
                self.sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
                print("SendGrid notification service initialized")
            except Exception as e:
                print(f"Failed to initialize SendGrid: {e}")
                self.sendgrid_enabled = False
        else:
            print("Email notifications disabled - missing SendGrid configuration")

    def create_notification(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        message: str,
        notification_type: str,
        tournament_id: Optional[UUID] = None,
        match_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        send_email: bool = True
    ) -> Notification:
        """Create a new notification for a user."""
        
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            tournament_id=tournament_id,
            match_id=match_id,
            team_id=team_id
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Send email if enabled and user has email notifications enabled
        if send_email:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.email_notifications:
                self.send_email_notification(user.email, user.name, title, message)
                notification.is_email_sent = True
                db.commit()
        
        return notification

    def get_user_notifications(
        self,
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        """Get notifications for a user."""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def mark_notification_read(self, db: Session, notification_id: UUID, user_id: UUID) -> bool:
        """Mark a notification as read."""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return False
        
        notification.is_read = True
        db.commit()
        return True

    def mark_all_read(self, db: Session, user_id: UUID) -> int:
        """Mark all notifications as read for a user."""
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        
        db.commit()
        return count

    def get_unread_count(self, db: Session, user_id: UUID) -> int:
        """Get count of unread notifications for a user."""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    def notify_team_members(
        self,
        db: Session,
        team_id: UUID,
        title: str,
        message: str,
        notification_type: str,
        tournament_id: Optional[UUID] = None,
        match_id: Optional[UUID] = None
    ) -> List[Notification]:
        """Send notification to all members of a team."""
        # Get all team members
        team_member_ids = db.query(team_members.c.user_id).filter(
            team_members.c.team_id == team_id,
            team_members.c.is_active == True
        ).all()
        
        notifications = []
        for (user_id,) in team_member_ids:
            notification = self.create_notification(
                db, user_id, title, message, notification_type,
                tournament_id=tournament_id, match_id=match_id, team_id=team_id
            )
            notifications.append(notification)
        
        return notifications

    def notify_tournament_participants(
        self,
        db: Session,
        tournament_id: UUID,
        title: str,
        message: str,
        notification_type: str,
        match_id: Optional[UUID] = None
    ) -> List[Notification]:
        """Send notification to all participants in a tournament."""
        from app.models.tournament import tournament_teams
        
        # Get all teams in tournament
        team_ids = db.query(tournament_teams.c.team_id).filter(
            tournament_teams.c.tournament_id == tournament_id
        ).all()
        
        notifications = []
        for (team_id,) in team_ids:
            team_notifications = self.notify_team_members(
                db, team_id, title, message, notification_type,
                tournament_id=tournament_id, match_id=match_id
            )
            notifications.extend(team_notifications)
        
        return notifications

    def send_email_notification(self, to_email: str, to_name: str, subject: str, content: str) -> bool:
        """Send email notification using SendGrid."""
        if not self.sendgrid_enabled:
            print(f"Email notification skipped (SendGrid disabled): {subject} to {to_email}")
            return False
        
        try:
            from_email = Email(self.from_email, "Aegis Tournaments")
            to_email_obj = To(to_email, to_name)
            
            # Create HTML content
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h1 style="color: #007bff; margin: 0;">Aegis Tournaments</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2 style="color: #333;">{subject}</h2>
                        <p style="color: #555; line-height: 1.6;">{content}</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #888; font-size: 12px;">
                            This is an automated notification from Aegis Tournaments. 
                            You can manage your notification preferences in your account settings.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            mail = Mail(from_email, to_email_obj, subject, Content("text/html", html_content))
            
            response = self.sg.send(mail)
            
            if response.status_code in [200, 201, 202]:
                print(f"Email sent successfully to {to_email}")
                return True
            else:
                print(f"Email sending failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Email sending error: {e}")
            return False

    def send_bulk_email(self, recipients: List[dict], subject: str, content: str) -> dict:
        """Send bulk email to multiple recipients."""
        if not self.sendgrid_enabled:
            return {"success": False, "reason": "SendGrid disabled"}
        
        success_count = 0
        failed_count = 0
        
        for recipient in recipients:
            success = self.send_email_notification(
                recipient["email"], 
                recipient["name"], 
                subject, 
                content
            )
            if success:
                success_count += 1
            else:
                failed_count += 1
        
        return {
            "success": True,
            "total_sent": success_count,
            "failed": failed_count,
            "total_recipients": len(recipients)
        }

    def create_match_notifications(
        self,
        db: Session,
        match_id: UUID,
        notification_type: str,
        custom_message: Optional[str] = None
    ):
        """Create notifications for match-related events."""
        from app.models.match import Match
        
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return
        
        # Default messages based on notification type
        messages = {
            "match_scheduled": f"Your match is scheduled for {match.scheduled_time}",
            "match_started": "Your match has started!",
            "match_completed": "Your match has been completed. Check the results!",
            "match_disputed": "There is a dispute regarding your match. Please contact support.",
            "result_updated": "Match results have been updated."
        }
        
        title = notification_type.replace("_", " ").title()
        message = custom_message or messages.get(notification_type, "Match update")
        
        notifications = []
        
        # Notify both teams
        if match.team1_id:
            team_notifications = self.notify_team_members(
                db, match.team1_id, title, message, notification_type,
                tournament_id=match.tournament_id, match_id=match_id
            )
            notifications.extend(team_notifications)
        
        if match.team2_id:
            team_notifications = self.notify_team_members(
                db, match.team2_id, title, message, notification_type,
                tournament_id=match.tournament_id, match_id=match_id
            )
            notifications.extend(team_notifications)
        
        return notifications

    def delete_old_notifications(self, db: Session, days_old: int = 30) -> int:
        """Delete notifications older than specified days."""
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        count = db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).count()
        
        db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).delete()
        
        db.commit()
        return count