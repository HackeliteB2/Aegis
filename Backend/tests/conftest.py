import pytest
import asyncio
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.models.user import User, UserRole
from app.core.auth import get_password_hash, create_access_token
from app.services.user_service import create_user

# Test database URL - using SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """Create test database session."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    """Create test client."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user(db_session):
    """Create test user."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "name": "Test User",
        "password": "testpassword123"
    }
    
    user = User(
        username=user_data["username"],
        email=user_data["email"],
        name=user_data["name"],
        hashed_password=get_password_hash(user_data["password"]),
        role=UserRole.PLAYER
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def test_admin(db_session):
    """Create test admin user."""
    admin_data = {
        "username": "admin",
        "email": "admin@example.com",
        "name": "Admin User",
        "password": "adminpassword123"
    }
    
    admin = User(
        username=admin_data["username"],
        email=admin_data["email"],
        name=admin_data["name"],
        hashed_password=get_password_hash(admin_data["password"]),
        role=UserRole.ADMIN
    )
    
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    
    return admin


@pytest.fixture
def test_organizer(db_session):
    """Create test organizer user."""
    organizer_data = {
        "username": "organizer",
        "email": "organizer@example.com",
        "name": "Tournament Organizer",
        "password": "organizerpassword123"
    }
    
    organizer = User(
        username=organizer_data["username"],
        email=organizer_data["email"],
        name=organizer_data["name"],
        hashed_password=get_password_hash(organizer_data["password"]),
        role=UserRole.ORGANIZER
    )
    
    db_session.add(organizer)
    db_session.commit()
    db_session.refresh(organizer)
    
    return organizer


@pytest.fixture
def auth_headers_user(test_user):
    """Create auth headers for test user."""
    token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_admin(test_admin):
    """Create auth headers for test admin."""
    token = create_access_token(data={"sub": test_admin.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_organizer(test_organizer):
    """Create auth headers for test organizer."""
    token = create_access_token(data={"sub": test_organizer.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_tournament_data():
    """Sample tournament data for testing."""
    return {
        "name": "Test Tournament",
        "description": "A test tournament",
        "game_title": "Test Game",
        "format": "single_elimination",
        "max_teams": 16,
        "min_teams": 4,
        "team_size": 5,
        "rules": "Test rules",
        "prize_pool": "$1000",
        "entry_fee": "Free",
        "is_public": True,
        "allow_spectators": True
    }


@pytest.fixture
def sample_team_data():
    """Sample team data for testing."""
    return {
        "name": "Test Team",
        "tag": "TEST",
        "description": "A test team",
        "contact_email": "team@example.com"
    }


@pytest.fixture
def sample_match_data():
    """Sample match data for testing."""
    return {
        "round_number": 1,
        "match_number": 1,
        "bracket_position": "R1M1",
        "best_of": 3
    }


# Test utilities
class TestUtils:
    @staticmethod
    def assert_status_code(response, expected_code):
        """Assert response status code with detailed error message."""
        if response.status_code != expected_code:
            print(f"Response body: {response.text}")
        assert response.status_code == expected_code
    
    @staticmethod
    def assert_json_contains(response_json, expected_keys):
        """Assert JSON response contains expected keys."""
        for key in expected_keys:
            assert key in response_json, f"Expected key '{key}' not found in response"
    
    @staticmethod
    def create_test_tournament(db_session, organizer_id, **kwargs):
        """Create a test tournament."""
        from app.models.tournament import Tournament, TournamentFormat
        
        tournament_data = {
            "name": "Test Tournament",
            "description": "Test Description",
            "game_title": "Test Game",
            "format": TournamentFormat.SINGLE_ELIMINATION,
            "organizer_id": organizer_id,
            "max_teams": 16,
            "min_teams": 4,
            "team_size": 5,
            **kwargs
        }
        
        tournament = Tournament(**tournament_data)
        db_session.add(tournament)
        db_session.commit()
        db_session.refresh(tournament)
        
        return tournament
    
    @staticmethod
    def create_test_team(db_session, captain_id, **kwargs):
        """Create a test team."""
        from app.models.team import Team
        
        team_data = {
            "name": "Test Team",
            "tag": "TEST",
            "description": "Test team description",
            "captain_id": captain_id,
            **kwargs
        }
        
        team = Team(**team_data)
        db_session.add(team)
        db_session.commit()
        db_session.refresh(team)
        
        return team


@pytest.fixture
def test_utils():
    """Provide test utilities."""
    return TestUtils