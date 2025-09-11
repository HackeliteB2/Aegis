from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from .config import settings
from typing import Generator
import os

Base = declarative_base()

# Use SQLite for local testing if PostgreSQL fails
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    # Try PostgreSQL first, fallback to SQLite if it fails
    try:
        engine = create_engine(
            database_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={
                "connect_timeout": 10,
                "application_name": "aegis_backend"
            }
        )
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        print("Falling back to SQLite for local testing...")
        database_url = "sqlite:///./aegis_local.db"
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(database_url, connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables in the database."""
    # Import all models to ensure they're registered with Base
    from app.models import user, tournament, team, match
    Base.metadata.create_all(bind=engine)


def test_db_connection():
    """Test database connection."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return result.fetchone()[0] == 1
    except Exception as e:
        return f"connection failed: {str(e)}"