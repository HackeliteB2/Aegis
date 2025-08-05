from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


def test_db_connection():
    try:
        import psycopg
        conn = psycopg.connect(settings.DATABASE_URL)
        conn.close()
        return True
    except ImportError:
        try:
            import psycopg2
            conn = psycopg2.connect(settings.DATABASE_URL)
            conn.close()
            return True
        except ImportError:
            return "no postgresql driver installed"
    except Exception as e:
        return f"connection failed: {str(e)}"


@router.get("/health")
async def health_check():
    db_result = test_db_connection()
    db_status = db_result is True
    
    return {
        "status": "healthy" if db_status else "degraded",
        "database": "connected" if db_status else db_result,
        "database_url_configured": bool(settings.DATABASE_URL)
    }


@router.get("/")
async def root():
    return {"message": "Aegis Backend API is running"}