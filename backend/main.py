from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes.api import api_router
from fastapi.responses import HTMLResponse, FileResponse
from pathlib import Path
from middleware.rate_limit import RateLimiter

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent  # Goes up from 'backend' to root
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = FastAPI(title="Burn after reading message")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
# app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")

# Add this middleware to prevent caching
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Mount static files with custom response class
class NoCache(StaticFiles):
    def is_not_modified(self, response_headers, request_headers) -> bool:
        return False

app.mount("/static", NoCache(directory=str(FRONTEND_DIR / "static")), name="static")

# Include API routes
app.include_router(api_router)

# Serve HTML pages
@app.get("/")
async def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/create")

@app.get("/create")
async def create():
    return FileResponse(str(FRONTEND_DIR / "create.html"))

@app.get("/success")
async def success():
    return FileResponse(str(FRONTEND_DIR / "success.html"))

# Add rate limiter middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    rate_limiter = RateLimiter()
    return await rate_limiter(request, call_next)