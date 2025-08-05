from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from .config import settings
from typing import Generator

engine = create_engine(settings.DATABASE_URL)
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
    from app.models.user import Base as UserBase
    UserBase.metadata.create_all(bind=engine)


def test_db_connection():
    """Test database connection."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return result.fetchone()[0] == 1
    except Exception as e:
        return f"connection failed: {str(e)}"