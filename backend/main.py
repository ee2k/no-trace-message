from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes.api import api_router
from fastapi.responses import HTMLResponse, FileResponse
from pathlib import Path

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
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")

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