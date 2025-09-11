import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


class TestTournamentCRUD:
    """Test tournament CRUD operations."""
    
    def test_create_tournament_success(self, client: TestClient, auth_headers_organizer, sample_tournament_data):
        """Test successful tournament creation."""
        response = client.post("/api/v1/tournaments/", 
                             json=sample_tournament_data, headers=auth_headers_organizer)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_tournament_data["name"]
        assert data["game_title"] == sample_tournament_data["game_title"]
        assert data["format"] == sample_tournament_data["format"]
        assert data["status"] == "draft"
        assert "id" in data
    
    def test_create_tournament_unauthorized(self, client: TestClient, auth_headers_user, sample_tournament_data):
        """Test tournament creation without proper role."""
        response = client.post("/api/v1/tournaments/", 
                             json=sample_tournament_data, headers=auth_headers_user)
        
        assert response.status_code == 403
    
    def test_get_tournament_list(self, client: TestClient, test_utils, db_session, test_organizer):
        """Test getting tournament list."""
        # Create test tournaments
        tournament1 = test_utils.create_test_tournament(db_session, test_organizer.id, name="Tournament 1")
        tournament2 = test_utils.create_test_tournament(db_session, test_organizer.id, name="Tournament 2")
        
        response = client.get("/api/v1/tournaments/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
    
    def test_get_tournament_detail(self, client: TestClient, test_utils, db_session, test_organizer):
        """Test getting tournament details."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        
        response = client.get(f"/api/v1/tournaments/{tournament.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(tournament.id)
        assert data["name"] == tournament.name
    
    def test_get_tournament_not_found(self, client: TestClient):
        """Test getting non-existent tournament."""
        fake_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/tournaments/{fake_id}")
        
        assert response.status_code == 404
    
    def test_update_tournament(self, client: TestClient, auth_headers_organizer, test_utils, db_session, test_organizer):
        """Test updating tournament."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        
        update_data = {
            "name": "Updated Tournament Name",
            "description": "Updated description"
        }
        
        response = client.put(f"/api/v1/tournaments/{tournament.id}", 
                            json=update_data, headers=auth_headers_organizer)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
    
    def test_update_tournament_unauthorized(self, client: TestClient, auth_headers_user, test_utils, db_session, test_organizer):
        """Test updating tournament without authorization."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        
        update_data = {"name": "Hacked Tournament"}
        
        response = client.put(f"/api/v1/tournaments/{tournament.id}", 
                            json=update_data, headers=auth_headers_user)
        
        assert response.status_code == 403
    
    def test_delete_tournament(self, client: TestClient, auth_headers_admin, test_utils, db_session, test_organizer):
        """Test deleting tournament (admin only)."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        
        response = client.delete(f"/api/v1/tournaments/{tournament.id}", headers=auth_headers_admin)
        
        assert response.status_code == 204
        
        # Verify tournament is deleted
        response = client.get(f"/api/v1/tournaments/{tournament.id}")
        assert response.status_code == 404


class TestTournamentRegistration:
    """Test tournament team registration."""
    
    def test_register_team_success(self, client: TestClient, auth_headers_user, test_utils, db_session, test_organizer, test_user):
        """Test successful team registration."""
        # Create tournament and team
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        team = test_utils.create_test_team(db_session, test_user.id)
        
        # Set tournament to registration open
        from app.models.tournament import TournamentStatus
        tournament.status = TournamentStatus.REGISTRATION_OPEN
        db_session.commit()
        
        registration_data = {"team_id": str(team.id)}
        
        response = client.post(f"/api/v1/tournaments/{tournament.id}/register", 
                             json=registration_data, headers=auth_headers_user)
        
        assert response.status_code == 201
        assert "successfully" in response.json()["message"].lower()
    
    def test_register_team_not_captain(self, client: TestClient, auth_headers_user, test_utils, db_session, test_organizer, test_admin):
        """Test team registration when user is not captain."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        team = test_utils.create_test_team(db_session, test_admin.id)  # Different captain
        
        from app.models.tournament import TournamentStatus
        tournament.status = TournamentStatus.REGISTRATION_OPEN
        db_session.commit()
        
        registration_data = {"team_id": str(team.id)}
        
        response = client.post(f"/api/v1/tournaments/{tournament.id}/register", 
                             json=registration_data, headers=auth_headers_user)
        
        assert response.status_code == 400
        assert "captain" in response.json()["detail"].lower()
    
    def test_get_tournament_teams(self, client: TestClient, test_utils, db_session, test_organizer, test_user):
        """Test getting teams registered for tournament."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        team = test_utils.create_test_team(db_session, test_user.id)
        
        # Register team manually for test
        from app.models.tournament import tournament_teams
        db_session.execute(tournament_teams.insert().values(
            tournament_id=tournament.id,
            team_id=team.id,
            is_approved=True
        ))
        db_session.commit()
        
        response = client.get(f"/api/v1/tournaments/{tournament.id}/teams")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["name"] == team.name


class TestTournamentDraw:
    """Test tournament draw generation."""
    
    def test_generate_draw_success(self, client: TestClient, auth_headers_organizer, test_utils, db_session, test_organizer, test_user):
        """Test successful draw generation."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        team = test_utils.create_test_team(db_session, test_user.id)
        
        # Set tournament status and register team
        from app.models.tournament import TournamentStatus, tournament_teams
        tournament.status = TournamentStatus.REGISTRATION_CLOSED
        db_session.commit()
        
        # Register enough teams
        for i in range(4):  # Minimum teams
            team_temp = test_utils.create_test_team(db_session, test_user.id, name=f"Team {i}", tag=f"T{i}")
            db_session.execute(tournament_teams.insert().values(
                tournament_id=tournament.id,
                team_id=team_temp.id,
                is_approved=True
            ))
        
        db_session.commit()
        
        response = client.post(f"/api/v1/tournaments/{tournament.id}/generate-draw", 
                             headers=auth_headers_organizer)
        
        assert response.status_code == 200
        data = response.json()
        assert "bracket_data" in data
        assert "tournament_id" in data
    
    def test_generate_draw_unauthorized(self, client: TestClient, auth_headers_user, test_utils, db_session, test_organizer):
        """Test draw generation without authorization."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        
        response = client.post(f"/api/v1/tournaments/{tournament.id}/generate-draw", 
                             headers=auth_headers_user)
        
        assert response.status_code == 403
    
    def test_get_tournament_bracket(self, client: TestClient, test_utils, db_session, test_organizer):
        """Test getting tournament bracket."""
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        
        # Create a bracket manually
        from app.models.tournament import Bracket
        bracket = Bracket(
            tournament_id=tournament.id,
            bracket_data={"format": "single_elimination", "teams": [], "rounds": 1},
            round_number=1
        )
        db_session.add(bracket)
        db_session.commit()
        
        response = client.get(f"/api/v1/tournaments/{tournament.id}/bracket")
        
        assert response.status_code == 200
        data = response.json()
        assert "bracket_data" in data
        assert "tournament_id" in data


class TestTournamentFiltering:
    """Test tournament filtering and search."""
    
    def test_filter_by_game_title(self, client: TestClient, test_utils, db_session, test_organizer):
        """Test filtering tournaments by game title."""
        tournament1 = test_utils.create_test_tournament(db_session, test_organizer.id, name="Valorant Tournament", game_title="Valorant")
        tournament2 = test_utils.create_test_tournament(db_session, test_organizer.id, name="CS2 Tournament", game_title="Counter-Strike 2")
        
        response = client.get("/api/v1/tournaments/?game_title=Valorant")
        
        assert response.status_code == 200
        data = response.json()
        valorant_tournaments = [t for t in data if "valorant" in t.get("game_title", "").lower()]
        assert len(valorant_tournaments) >= 1
    
    def test_filter_by_status(self, client: TestClient, test_utils, db_session, test_organizer):
        """Test filtering tournaments by status."""
        from app.models.tournament import TournamentStatus
        
        tournament = test_utils.create_test_tournament(db_session, test_organizer.id)
        tournament.status = TournamentStatus.REGISTRATION_OPEN
        db_session.commit()
        
        response = client.get("/api/v1/tournaments/?status_filter=registration_open")
        
        assert response.status_code == 200
        data = response.json()
        open_tournaments = [t for t in data if t.get("status") == "registration_open"]
        assert len(open_tournaments) >= 1
    
    def test_pagination(self, client: TestClient, test_utils, db_session, test_organizer):
        """Test tournament list pagination."""
        # Create multiple tournaments
        for i in range(5):
            test_utils.create_test_tournament(db_session, test_organizer.id, name=f"Tournament {i}")
        
        response = client.get("/api/v1/tournaments/?skip=0&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3


class TestTournamentStats:
    """Test tournament statistics."""
    
    def test_get_tournament_stats_admin(self, client: TestClient, auth_headers_admin, test_utils, db_session, test_organizer):
        """Test getting tournament stats as admin."""
        # Create some test data
        test_utils.create_test_tournament(db_session, test_organizer.id)
        test_utils.create_test_tournament(db_session, test_organizer.id)
        
        response = client.get("/api/v1/tournaments/stats/overview", headers=auth_headers_admin)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_tournaments" in data
        assert "active_tournaments" in data
        assert "completed_tournaments" in data
        assert isinstance(data["total_tournaments"], int)
    
    def test_get_tournament_stats_unauthorized(self, client: TestClient, auth_headers_user):
        """Test getting tournament stats without admin access."""
        response = client.get("/api/v1/tournaments/stats/overview", headers=auth_headers_user)
        
        assert response.status_code == 403