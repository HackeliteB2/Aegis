import pytest
from fastapi.testclient import TestClient


class TestAuthentication:
    """Test authentication endpoints."""
    
    def test_register_user_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "name": "New User",
            "password": "newpassword123"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["username"] == user_data["username"]
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["role"] == "player"  # default role
    
    def test_register_user_duplicate_username(self, client: TestClient, test_user):
        """Test registration with duplicate username."""
        user_data = {
            "username": test_user.username,
            "email": "different@example.com",
            "name": "Different User",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_user_duplicate_email(self, client: TestClient, test_user):
        """Test registration with duplicate email."""
        user_data = {
            "username": "differentuser",
            "email": test_user.email,
            "name": "Different User",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_login_success(self, client: TestClient, test_user):
        """Test successful login."""
        login_data = {
            "username": test_user.username,
            "password": "testpassword123"  # from conftest.py
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["username"] == test_user.username
        assert "access_token" in data["token"]
        assert data["token"]["token_type"] == "bearer"
    
    def test_login_invalid_username(self, client: TestClient):
        """Test login with invalid username."""
        login_data = {
            "username": "nonexistentuser",
            "password": "somepassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()
    
    def test_login_invalid_password(self, client: TestClient, test_user):
        """Test login with invalid password."""
        login_data = {
            "username": test_user.username,
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()
    
    def test_get_current_user(self, client: TestClient, auth_headers_user, test_user):
        """Test getting current user info."""
        response = client.get("/api/v1/auth/me", headers=auth_headers_user)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["role"] == test_user.role.value
    
    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_protected_route(self, client: TestClient, auth_headers_user, test_user):
        """Test access to protected route."""
        response = client.get("/api/v1/protected", headers=auth_headers_user)
        
        assert response.status_code == 200
        data = response.json()
        assert test_user.username in data["message"]
        assert data["user_role"] == test_user.role.value
    
    def test_protected_route_no_auth(self, client: TestClient):
        """Test access to protected route without authentication."""
        response = client.get("/api/v1/protected")
        
        assert response.status_code == 401


class TestUserManagement:
    """Test user management functionality."""
    
    def test_update_user_profile(self, client: TestClient, auth_headers_user, test_user):
        """Test updating user profile."""
        update_data = {
            "name": "Updated Name",
            "bio": "Updated bio",
            "preferred_games": "Game1,Game2"
        }
        
        response = client.put(f"/api/v1/auth/users/{test_user.id}", 
                            json=update_data, headers=auth_headers_user)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["bio"] == update_data["bio"]
        assert data["preferred_games"] == update_data["preferred_games"]
    
    def test_change_password(self, client: TestClient, auth_headers_user):
        """Test changing password."""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newtestpassword123"
        }
        
        response = client.post("/api/v1/auth/change-password", 
                             json=password_data, headers=auth_headers_user)
        
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()
    
    def test_change_password_wrong_current(self, client: TestClient, auth_headers_user):
        """Test changing password with wrong current password."""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newtestpassword123"
        }
        
        response = client.post("/api/v1/auth/change-password", 
                             json=password_data, headers=auth_headers_user)
        
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()


class TestUserRoles:
    """Test user role-based access control."""
    
    def test_admin_access_user_list(self, client: TestClient, auth_headers_admin):
        """Test admin accessing user list."""
        response = client.get("/api/v1/auth/users", headers=auth_headers_admin)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_regular_user_cannot_access_user_list(self, client: TestClient, auth_headers_user):
        """Test regular user cannot access admin endpoints."""
        response = client.get("/api/v1/auth/users", headers=auth_headers_user)
        assert response.status_code == 403
    
    def test_organizer_role_permissions(self, client: TestClient, auth_headers_organizer, sample_tournament_data):
        """Test organizer can create tournaments."""
        response = client.post("/api/v1/tournaments/", 
                             json=sample_tournament_data, headers=auth_headers_organizer)
        assert response.status_code == 201
    
    def test_player_cannot_create_tournament(self, client: TestClient, auth_headers_user, sample_tournament_data):
        """Test regular player cannot create tournaments."""
        response = client.post("/api/v1/tournaments/", 
                             json=sample_tournament_data, headers=auth_headers_user)
        assert response.status_code == 403