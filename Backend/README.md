# Aegis Backend

A FastAPI backend application with PostgreSQL database integration.

## Features

- FastAPI web framework with automatic API documentation
- PostgreSQL database connection using psycopg driver
- Health check endpoint with database status monitoring
- CORS middleware enabled for any frontend URL
- Environment-based configuration with .env support
- Production-ready with uvicorn ASGI server

## Project Structure

```
BACKEND/
├── app/
│   ├── api/
│   │   ├── routes.py          # API endpoints
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py          # Configuration settings
│   │   ├── database.py        # Database connection
│   │   └── __init__.py
│   ├── main.py                # FastAPI app initialization
│   └── __init__.py
├── .env.example               # Environment variables template
├── .gitignore                # Git ignore rules
├── requirements.txt          # Python dependencies
├── run.py                    # Development server runner
├── start.bat                 # Windows startup script
└── README.md                 # This file
```

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd BACKEND
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   
   **Note**: The backend uses `psycopg[binary]` for PostgreSQL connection, which includes pre-compiled binaries and doesn't require Visual C++ build tools.

5. Set up environment variables:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```
   DATABASE_URL=postgresql://username:password@host:5432/aegis_db
   SECRET_KEY=your-secret-key-here
   BACKEND_CORS_ORIGINS=["*"]
   ```
   
   **Important**: Make sure the database `aegis_db` exists on your PostgreSQL server before running the application.

### Running the Application

#### Development Mode

```bash
python run.py
```

Or use the Windows batch file:
```bash
start.bat
```

The API will be available at: `http://localhost:8000`

#### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- **GET** `/api/v1/health`
  - Returns application and database health status
  - Response (healthy):
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "database_url_configured": true
    }
    ```
  - Response (degraded):
    ```json
    {
      "status": "degraded",
      "database": "connection failed: database 'aegis_db' does not exist",
      "database_url_configured": true
    }
    ```

### Root
- **GET** `/api/v1/`
  - Returns basic API information
  - Response:
    ```json
    {
      "message": "Aegis Backend API is running"
    }
    ```

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Configuration

The application uses environment variables for configuration. Key settings:

- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `SECRET_KEY`: Secret key for security operations
- `DEBUG`: Enable/disable debug mode (default: True)
- `API_V1_STR`: API version prefix (default: /api/v1)
- `APP_NAME`: Application name (default: Aegis Backend)
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins - set to `["*"]` to allow any frontend URL

## Development

### Adding New Endpoints

1. Add new routes in `app/api/routes.py`
2. Import and include the router in `app/main.py`

### Database Operations

Currently, the backend provides basic database connectivity testing. The psycopg driver is used for PostgreSQL connections. Database operations can be added by implementing SQLAlchemy models and services.

## Testing

### Quick Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### Test API Root
```bash
curl http://localhost:8000/api/v1/
```

### Access Interactive Documentation
Open in browser: `http://localhost:8000/docs`

## Troubleshooting

### Database Connection Issues

1. **PostgreSQL Server**: Verify PostgreSQL is running on the specified host and port
2. **Credentials**: Check username/password in `.env` file
3. **Database Exists**: Ensure the `aegis_db` database exists on your PostgreSQL server
4. **Network**: Check firewall/network connectivity to database host
5. **Health Check**: Use `/api/v1/health` endpoint to see specific error messages

### Common Error Messages

- `"psycopg not installed"` → Run `pip install psycopg[binary]`
- `"database 'aegis_db' does not exist"` → Create the database on your PostgreSQL server
- `"password authentication failed"` → Check username/password in `.env`
- `"connection refused"` → PostgreSQL server not running or wrong host/port

### Import Errors

Make sure you're in the correct directory and virtual environment is activated:
```bash
# Check current directory
pwd

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

## Current Status

✅ **API Server**: Running on `http://localhost:8000`  
✅ **Database**: Connected to PostgreSQL  
✅ **Health Check**: Operational  
✅ **CORS**: Enabled for all origins  
✅ **Documentation**: Available at `/docs`