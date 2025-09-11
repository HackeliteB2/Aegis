
#!/usr/bin/env python3
"""
Complete endpoint testing for Aegis Backend API
Tests every endpoint to ensure 100% functionality
"""

import requests
import json
from typing import Dict, Any, Optional

BASE_URL = "http://127.0.0.1:8001/api/v1"

class EndpointTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_data = {}
        self.results = {
            "passed": 0,
            "failed": 0,
            "total": 0,
            "details": []
        }

    def log_result(self, endpoint: str, method: str, status: str, details: str = ""):
        """Log test result"""
        self.results["total"] += 1
        if status == "PASS":
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
        
        self.results["details"].append({
            "endpoint": endpoint,
            "method": method,
            "status": status,
            "details": details
        })
        print(f"[{status}] {method} {endpoint} - {details}")

    def test_endpoint(self, method: str, endpoint: str, data: Any = None, headers: Dict = None, expected_status: int = 200, description: str = "") -> Optional[Dict]:
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers)
            elif method == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers)
            
            if response.status_code == expected_status:
                self.log_result(endpoint, method, "PASS", f"{response.status_code} - {description}")
                try:
                    return response.json()
                except:
                    return {"status": "success", "response": response.text}
            else:
                self.log_result(endpoint, method, "FAIL", f"Expected {expected_status}, got {response.status_code}")
                return None
                
        except Exception as e:
            self.log_result(endpoint, method, "ERROR", str(e))
            return None

    def run_comprehensive_tests(self):
        """Run all comprehensive tests"""
        print("=" * 60)
        print("AEGIS BACKEND - COMPREHENSIVE ENDPOINT TESTING")
        print("=" * 60)
        
        # 1. Health Check
        self.test_endpoint("GET", "/health", description="Health check")
        self.test_endpoint("GET", "/", description="API root")

        # 2. Authentication Tests
        print("\n--- AUTHENTICATION TESTS ---")
        
        # Register admin
        admin_data = {
            "username": "admin",
            "email": "admin@aegis.com",
            "password": "AdminPass123!",
            "name": "System Admin"
        }
        admin_response = self.test_endpoint("POST", "/auth/register", admin_data, description="Register admin")
        
        # Register organizer
        organizer_data = {
            "username": "organizer",
            "email": "organizer@aegis.com",
            "password": "OrganizerPass123!",
            "name": "Tournament Organizer"
        }
        organizer_response = self.test_endpoint("POST", "/auth/register", organizer_data, description="Register organizer")
        
        # Register players
        player1_data = {
            "username": "player1",
            "email": "player1@aegis.com",
            "password": "PlayerPass123!",
            "name": "Player One"
        }
        player1_response = self.test_endpoint("POST", "/auth/register", player1_data, description="Register player1")
        
        player2_data = {
            "username": "player2",
            "email": "player2@aegis.com",
            "password": "PlayerPass123!",
            "name": "Player Two"
        }
        player2_response = self.test_endpoint("POST", "/auth/register", player2_data, description="Register player2")

        # Login tests
        admin_login = self.test_endpoint("POST", "/auth/login", {
            "email": "admin@aegis.com",
            "password": "AdminPass123!"
        }, description="Admin login")
        
        if admin_login:
            self.tokens["admin"] = admin_login.get("token", {}).get("access_token")
            self.test_data["admin_id"] = admin_login.get("user", {}).get("id")

        organizer_login = self.test_endpoint("POST", "/auth/login", {
            "email": "organizer@aegis.com", 
            "password": "OrganizerPass123!"
        }, description="Organizer login")
        
        if organizer_login:
            self.tokens["organizer"] = organizer_login.get("token", {}).get("access_token")
            self.test_data["organizer_id"] = organizer_login.get("user", {}).get("id")

        player1_login = self.test_endpoint("POST", "/auth/login", {
            "email": "player1@aegis.com",
            "password": "PlayerPass123!"
        }, description="Player1 login")
        
        if player1_login:
            self.tokens["player1"] = player1_login.get("token", {}).get("access_token")
            self.test_data["player1_id"] = player1_login.get("user", {}).get("id")

        player2_login = self.test_endpoint("POST", "/auth/login", {
            "email": "player2@aegis.com",
            "password": "PlayerPass123!"
        }, description="Player2 login")
        
        if player2_login:
            self.tokens["player2"] = player2_login.get("token", {}).get("access_token")
            self.test_data["player2_id"] = player2_login.get("user", {}).get("id")

        # 3. User Management Tests
        print("\n--- USER MANAGEMENT TESTS ---")
        
        admin_headers = {"Authorization": f"Bearer {self.tokens.get('admin', '')}"}
        organizer_headers = {"Authorization": f"Bearer {self.tokens.get('organizer', '')}"}
        player1_headers = {"Authorization": f"Bearer {self.tokens.get('player1', '')}"}
        player2_headers = {"Authorization": f"Bearer {self.tokens.get('player2', '')}"}

        # Get current user
        self.test_endpoint("GET", "/auth/me", headers=admin_headers, description="Get admin profile")
        self.test_endpoint("GET", "/auth/me", headers=organizer_headers, description="Get organizer profile")
        self.test_endpoint("GET", "/auth/me", headers=player1_headers, description="Get player profile")

        # Update profile
        update_data = {"name": "Updated Admin Name"}
        self.test_endpoint("PUT", "/users/profile", update_data, headers=admin_headers, description="Update admin profile")

        # List users (admin only)
        self.test_endpoint("GET", "/users/", headers=admin_headers, description="List all users (admin)")

        # 4. Team Management Tests  
        print("\n--- TEAM MANAGEMENT TESTS ---")
        
        # Create teams
        team1_data = {
            "name": "Team Alpha",
            "tag": "ALPHA",
            "description": "First test team"
        }
        team1_response = self.test_endpoint("POST", "/teams/", team1_data, headers=player1_headers, description="Create team1")
        
        if team1_response:
            self.test_data["team1_id"] = team1_response.get("id")

        team2_data = {
            "name": "Team Beta", 
            "tag": "BETA",
            "description": "Second test team"
        }
        team2_response = self.test_endpoint("POST", "/teams/", team2_data, headers=player2_headers, description="Create team2")
        
        if team2_response:
            self.test_data["team2_id"] = team2_response.get("id")

        # List teams
        self.test_endpoint("GET", "/teams/", description="List all teams")
        
        # Get team details
        if self.test_data.get("team1_id"):
            self.test_endpoint("GET", f"/teams/{self.test_data['team1_id']}", description="Get team1 details")

        # Update team
        if self.test_data.get("team1_id"):
            update_team_data = {"description": "Updated team description"}
            self.test_endpoint("PUT", f"/teams/{self.test_data['team1_id']}", update_team_data, headers=player1_headers, description="Update team1")

        # 5. Tournament Management Tests
        print("\n--- TOURNAMENT MANAGEMENT TESTS ---")
        
        # Create tournament
        tournament_data = {
            "name": "Test Championship",
            "description": "Test tournament for API verification",
            "game_title": "Valorant",
            "format": "SINGLE_ELIMINATION",
            "max_teams": 8,
            "registration_start": "2024-01-15T10:00:00",
            "registration_end": "2024-01-20T23:59:59",
            "tournament_start": "2024-01-22T10:00:00",
            "tournament_end": "2024-01-25T18:00:00",
            "entry_fee": 0,
            "prize_pool": 1000,
            "rules": "Standard tournament rules apply"
        }
        tournament_response = self.test_endpoint("POST", "/tournaments/", tournament_data, headers=organizer_headers, description="Create tournament")
        
        if tournament_response:
            self.test_data["tournament_id"] = tournament_response.get("id")

        # List tournaments
        self.test_endpoint("GET", "/tournaments/", description="List all tournaments")
        
        # Get tournament details
        if self.test_data.get("tournament_id"):
            self.test_endpoint("GET", f"/tournaments/{self.test_data['tournament_id']}", description="Get tournament details")

        # Update tournament
        if self.test_data.get("tournament_id"):
            update_tournament_data = {"description": "Updated tournament description"}
            self.test_endpoint("PUT", f"/tournaments/{self.test_data['tournament_id']}", update_tournament_data, headers=organizer_headers, description="Update tournament")

        # Register teams for tournament
        if self.test_data.get("tournament_id") and self.test_data.get("team1_id"):
            self.test_endpoint("POST", f"/tournaments/{self.test_data['tournament_id']}/register/{self.test_data['team1_id']}", headers=player1_headers, description="Register team1 to tournament")

        if self.test_data.get("tournament_id") and self.test_data.get("team2_id"):
            self.test_endpoint("POST", f"/tournaments/{self.test_data['tournament_id']}/register/{self.test_data['team2_id']}", headers=player2_headers, description="Register team2 to tournament")

        # Get tournament participants
        if self.test_data.get("tournament_id"):
            self.test_endpoint("GET", f"/tournaments/{self.test_data['tournament_id']}/teams", description="Get tournament teams")

        # 6. Match Management Tests
        print("\n--- MATCH MANAGEMENT TESTS ---")

        # Create match
        if self.test_data.get("tournament_id") and self.test_data.get("team1_id") and self.test_data.get("team2_id"):
            match_data = {
                "tournament_id": self.test_data["tournament_id"],
                "team1_id": self.test_data["team1_id"],
                "team2_id": self.test_data["team2_id"],
                "round_number": 1,
                "scheduled_time": "2024-01-22T14:00:00"
            }
            match_response = self.test_endpoint("POST", "/matches/", match_data, headers=organizer_headers, description="Create match")
            
            if match_response:
                self.test_data["match_id"] = match_response.get("id")

        # List matches
        self.test_endpoint("GET", "/matches/", description="List all matches")

        # Get match details
        if self.test_data.get("match_id"):
            self.test_endpoint("GET", f"/matches/{self.test_data['match_id']}", description="Get match details")

        # Update match result
        if self.test_data.get("match_id"):
            result_data = {
                "team1_score": 2,
                "team2_score": 1,
                "winner_id": self.test_data.get("team1_id"),
                "status": "COMPLETED"
            }
            self.test_endpoint("PUT", f"/matches/{self.test_data['match_id']}/result", result_data, headers=organizer_headers, description="Update match result")

        # 7. Advanced Features Tests
        print("\n--- ADVANCED FEATURES TESTS ---")

        # Generate tournament draw
        if self.test_data.get("tournament_id"):
            self.test_endpoint("POST", f"/tournaments/{self.test_data['tournament_id']}/generate-draw", headers=organizer_headers, description="Generate tournament draw")

        # Get AI match summary
        if self.test_data.get("match_id"):
            self.test_endpoint("GET", f"/matches/{self.test_data['match_id']}/summary", description="Get AI match summary")

        # Get tournament bracket
        if self.test_data.get("tournament_id"):
            self.test_endpoint("GET", f"/tournaments/{self.test_data['tournament_id']}/bracket", description="Get tournament bracket")

        # 8. Service Status Tests
        print("\n--- SERVICE STATUS TESTS ---")
        self.test_endpoint("GET", "/services/status", description="Get all services status")
        self.test_endpoint("GET", "/services/blockchain/status", description="Get blockchain status")

        # Print final results
        self.print_results()

    def print_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("COMPREHENSIVE TEST RESULTS")
        print("=" * 60)
        print(f"Total Tests: {self.results['total']}")
        print(f"Passed: {self.results['passed']}")
        print(f"Failed: {self.results['failed']}")
        
        success_rate = (self.results['passed'] / self.results['total']) * 100 if self.results['total'] > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.results['failed'] > 0:
            print(f"\nFAILED TESTS:")
            for result in self.results['details']:
                if result['status'] in ['FAIL', 'ERROR']:
                    print(f"- {result['method']} {result['endpoint']}: {result['details']}")
        
        print(f"\nBACKEND STATUS: {'✅ READY FOR FRONTEND' if success_rate >= 95 else '❌ NEEDS FIXES'}")

if __name__ == "__main__":
    tester = EndpointTester()
    tester.run_comprehensive_tests()