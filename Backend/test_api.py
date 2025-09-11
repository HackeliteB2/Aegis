#!/usr/bin/env python3
"""
Aegis Backend API Testing Script

This script tests all major API endpoints to ensure the backend is working correctly.
Run this after setting up the backend to verify everything is functioning.

Usage:
    python test_api.py
"""

import asyncio
import json
import sys
from typing import Dict, Any
import httpx
import websockets
from datetime import datetime


class AegisAPITester:
    """Comprehensive API testing for Aegis backend."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/v1"
        self.ws_url = base_url.replace("http", "ws") + "/ws"
        self.session = httpx.Client(timeout=30.0)
        self.tokens = {}
        self.test_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log test progress."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def assert_status(self, response: httpx.Response, expected: int, endpoint: str):
        """Assert response status code."""
        if response.status_code != expected:
            self.log(f"❌ {endpoint} failed. Expected {expected}, got {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return False
        return True
        
    def test_health_check(self) -> bool:
        """Test basic health check endpoint."""
        self.log("🔍 Testing health check...")
        try:
            response = self.session.get(f"{self.api_url}/health")
            if self.assert_status(response, 200, "Health Check"):
                data = response.json()
                self.log(f"✅ Health check passed: {data.get('status', 'unknown')}")
                return True
        except Exception as e:
            self.log(f"❌ Health check failed: {str(e)}", "ERROR")
        return False
        
    def test_authentication(self) -> bool:
        """Test user registration and authentication."""
        self.log("🔐 Testing authentication...")
        
        # Test registration
        try:
            user_data = {
                "username": "testuser123",
                "email": "testuser@example.com",
                "name": "Test User",
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{self.api_url}/auth/register", json=user_data)
            if not self.assert_status(response, 201, "User Registration"):
                return False
                
            data = response.json()
            self.tokens['user'] = data['token']['access_token']
            self.test_data['user_id'] = data['user']['id']
            self.log("✅ User registration successful")
            
            # Test login
            login_data = {
                "username": user_data["username"],
                "password": user_data["password"]
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", json=login_data)
            if not self.assert_status(response, 200, "User Login"):
                return False
                
            self.log("✅ User login successful")
            
            # Test protected endpoint
            headers = {"Authorization": f"Bearer {self.tokens['user']}"}
            response = self.session.get(f"{self.api_url}/auth/me", headers=headers)
            if not self.assert_status(response, 200, "Get Current User"):
                return False
                
            self.log("✅ Protected endpoint access successful")
            return True
            
        except Exception as e:
            self.log(f"❌ Authentication test failed: {str(e)}", "ERROR")
            return False
            
    def test_tournaments(self) -> bool:
        """Test tournament management endpoints."""
        self.log("🏆 Testing tournament management...")
        
        if 'user' not in self.tokens:
            self.log("❌ User token required for tournament tests", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.tokens['user']}"}
            
            # Note: This will fail with 403 unless user is organizer/admin
            # This is expected behavior for proper access control
            tournament_data = {
                "name": "Test Tournament",
                "description": "A test tournament",
                "game_title": "Test Game",
                "format": "single_elimination",
                "max_teams": 16,
                "min_teams": 4,
                "team_size": 5,
                "is_public": True
            }
            
            response = self.session.post(f"{self.api_url}/tournaments/", json=tournament_data, headers=headers)
            
            if response.status_code == 403:
                self.log("⚠️  Tournament creation requires organizer role (expected behavior)")
            elif self.assert_status(response, 201, "Create Tournament"):
                data = response.json()
                self.test_data['tournament_id'] = data['id']
                self.log("✅ Tournament creation successful")
            
            # Test tournament listing (should work for all users)
            response = self.session.get(f"{self.api_url}/tournaments/")
            if not self.assert_status(response, 200, "List Tournaments"):
                return False
                
            tournaments = response.json()
            self.log(f"✅ Tournament listing successful ({len(tournaments)} tournaments found)")
            return True
            
        except Exception as e:
            self.log(f"❌ Tournament test failed: {str(e)}", "ERROR")
            return False
            
    def test_teams(self) -> bool:
        """Test team management endpoints."""
        self.log("👥 Testing team management...")
        
        if 'user' not in self.tokens:
            self.log("❌ User token required for team tests", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.tokens['user']}"}
            
            # Create team
            team_data = {
                "name": "Test Team",
                "tag": "TEST",
                "description": "A test team for API testing"
            }
            
            response = self.session.post(f"{self.api_url}/teams/", json=team_data, headers=headers)
            if not self.assert_status(response, 201, "Create Team"):
                return False
                
            data = response.json()
            self.test_data['team_id'] = data['id']
            self.log("✅ Team creation successful")
            
            # Test team listing
            response = self.session.get(f"{self.api_url}/teams/")
            if not self.assert_status(response, 200, "List Teams"):
                return False
                
            teams = response.json()
            self.log(f"✅ Team listing successful ({len(teams)} teams found)")
            
            # Test team details
            team_id = self.test_data['team_id']
            response = self.session.get(f"{self.api_url}/teams/{team_id}")
            if not self.assert_status(response, 200, "Get Team Details"):
                return False
                
            self.log("✅ Team details retrieval successful")
            return True
            
        except Exception as e:
            self.log(f"❌ Team test failed: {str(e)}", "ERROR")
            return False
            
    async def test_websocket(self) -> bool:
        """Test WebSocket real-time functionality."""
        self.log("⚡ Testing WebSocket connections...")
        
        try:
            # Test WebSocket connection without authentication
            async with websockets.connect(self.ws_url) as websocket:
                # Send ping
                await websocket.send(json.dumps({"type": "ping"}))
                
                # Wait for pong response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                
                if data.get("type") == "connection_established":
                    self.log("✅ WebSocket connection established")
                    
                    # Wait for pong
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(response)
                    
                    if data.get("type") == "pong":
                        self.log("✅ WebSocket ping/pong successful")
                        return True
                        
        except Exception as e:
            self.log(f"❌ WebSocket test failed: {str(e)}", "ERROR")
            return False
            
    def test_statistics(self) -> bool:
        """Test statistics endpoints (public endpoints only)."""
        self.log("📊 Testing statistics endpoints...")
        
        try:
            # Test WebSocket stats (public endpoint)
            response = self.session.get(f"{self.base_url}/ws/stats")
            if not self.assert_status(response, 200, "WebSocket Stats"):
                return False
                
            stats = response.json()
            self.log(f"✅ WebSocket stats retrieved (connections: {stats.get('total_connections', 0)})")
            return True
            
        except Exception as e:
            self.log(f"❌ Statistics test failed: {str(e)}", "ERROR")
            return False
            
    async def run_all_tests(self) -> bool:
        """Run all API tests."""
        self.log("🚀 Starting Aegis API Tests...")
        self.log(f"📡 Testing API at: {self.base_url}")
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Authentication", self.test_authentication),
            ("Tournaments", self.test_tournaments),
            ("Teams", self.test_teams),
            ("WebSocket", self.test_websocket),
            ("Statistics", self.test_statistics),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"🧪 Running {test_name} test...")
            try:
                if asyncio.iscoroutinefunction(test_func):
                    result = await test_func()
                else:
                    result = test_func()
                    
                if result:
                    passed += 1
                    self.log(f"✅ {test_name} test PASSED")
                else:
                    self.log(f"❌ {test_name} test FAILED", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ {test_name} test ERROR: {str(e)}", "ERROR")
                
            self.log("-" * 50)
            
        # Summary
        self.log(f"📋 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests PASSED! Backend is working correctly.", "SUCCESS")
            return True
        else:
            self.log(f"⚠️  {total - passed} tests FAILED. Check the logs above.", "WARNING")
            return False
            
    def cleanup(self):
        """Clean up resources."""
        if self.session:
            self.session.close()


async def main():
    """Main test runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Aegis Backend API")
    parser.add_argument("--url", default="http://localhost:8000", 
                       help="Base URL of the API (default: http://localhost:8000)")
    
    args = parser.parse_args()
    
    tester = AegisAPITester(args.url)
    
    try:
        success = await tester.run_all_tests()
        return 0 if success else 1
        
    except KeyboardInterrupt:
        tester.log("🛑 Tests interrupted by user", "WARNING")
        return 130
        
    except Exception as e:
        tester.log(f"💥 Unexpected error: {str(e)}", "ERROR")
        return 1
        
    finally:
        tester.cleanup()


if __name__ == "__main__":
    # Check dependencies
    try:
        import httpx
        import websockets
    except ImportError as e:
        print(f"❌ Missing required dependency: {e}")
        print("Install with: pip install httpx websockets")
        sys.exit(1)
        
    # Run tests
    exit_code = asyncio.run(main())