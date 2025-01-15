from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes.api import api_router
from routes.pages import router as pages_router
from fastapi.responses import JSONResponse
from pathlib import Path
from middleware.rate_limit import RateLimiter
import logging
from contextlib import asynccontextmanager
from datetime import datetime
import os
from typing import List
from fastapi import HTTPException
import sys
import signal
import traceback
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "logs"

# Create logs directory if it doesn't exist
LOG_DIR.mkdir(exist_ok=True)

# Configure logging
log_level = os.getenv("LOG_LEVEL", "info").upper()

logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    logger.info(f"Application starting up with log level ===: {log_level}")
    try:
        # Startup: Initialize resources
        from services.message_store import MessageStore
        await MessageStore().initialize()
        logger.info("Application startup complete")
        yield
    finally:
        # Shutdown: Cleanup resources
        logger.info("Application shutting down...")
        try:
            from services.message_store import MessageStore
            await MessageStore().cleanup()
            logger.info("Application shutdown complete")
        except Exception as e:
            logger.error(f"Shutdown error: {e}", exc_info=True)

# Production settings
app = FastAPI(
    title="Burn after reading message",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan
)

# Get CORS origins from environment variable
def get_cors_origins() -> List[str]:
    origins = os.getenv("CORS_ORIGINS", "http://localhost")
    return [origin.strip() for origin in origins.split(",")]

# always put RateLimiter before CORSMiddleware and routers
app.add_middleware(
    RateLimiter,
    ip_limit=10,        # 3 requests per minute per IP
    window_size=60     # 1 minute window
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pages_router)
app.include_router(api_router, prefix="/api")

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Cache control
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Error handling - Order matters!
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.info(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Uncaught exception\n"
        f"Path: {request.url.path}\n"
        f"Method: {request.method}\n"
        f"Error: {str(exc)}\n"
        f"Traceback: {traceback.format_exc()}"
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Add any specific health checks here
        # Example: Check message store
        from services.message_store import MessageStore
        store_status = await MessageStore().check_health()
        
        return {
            "status": "healthy",
            "message_store": store_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    try:
        response = await call_next(request)
        duration = datetime.now() - start_time
        logger.info(
            f"Path: {request.url.path} "
            f"Method: {request.method} "
            f"Duration: {duration.total_seconds():.3f}s "
            f"Status: {response.status_code}"
        )
        return response
    except Exception as e:
        logger.error(
            f"Request failed - Path: {request.url.path} "
            f"Method: {request.method} "
            f"Error: {str(e)}\n"
            f"Traceback: {traceback.format_exc()}"
        )
        raise

# Signal handlers
def signal_handler(signum, frame):
    sig_name = signal.Signals(signum).name
    logger.info(f"Received signal {sig_name} ({signum})")
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get configuration from environment variables
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    
    logger.info(f"Starting server - Host: {host}, Port: {port}")
    
    # Don't run with these settings directly
    # Use external uvicorn command instead
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        proxy_headers=True,
        forwarded_allow_ips="*",
        log_level=log_level
    )