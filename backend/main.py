from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes.api import api_router
from routes.pages import router
from fastapi.responses import JSONResponse
from pathlib import Path
from middleware.rate_limit import RateLimiter
import logging
from contextlib import asynccontextmanager
from datetime import datetime
import os
from typing import List
from fastapi import HTTPException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
FRONTEND_DIR = PROJECT_ROOT / "frontend"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    logger.info("Application starting up...")
    try:
        # Startup: Initialize resources
        FRONTEND_DIR.exists() or logger.error("Frontend directory not found!")
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)
app.include_router(router)

# Add rate limiting with browser and IP limits
app.add_middleware(
    RateLimiter,
    browser_limit=3,    # 3 requests per minute per browser
    ip_limit=10,        # 10 requests per minute per IP
    window_size=60      # 1 minute window
)

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

# Error handling
@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    logger.error(f"Internal error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )

# Add rate limit error handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)}
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

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get configuration from environment variables
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    logger.info(f"Starting server - Host: {host}, Port: {port}, Workers: {workers}")
    
    # Don't run with these settings directly
    # Use external uvicorn command instead
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        proxy_headers=True,
        forwarded_allow_ips="*",
        log_level=log_level
    )