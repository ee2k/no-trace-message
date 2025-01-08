from fastapi import APIRouter
from fastapi.responses import FileResponse, RedirectResponse
from pathlib import Path

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

router = APIRouter()

@router.get("/")
async def root():
    return RedirectResponse(url="/create")

@router.get("/create")
async def create():
    return FileResponse(FRONTEND_DIR / "create.html")

@router.get("/success")
async def success():
    return FileResponse(FRONTEND_DIR / "success.html")

@router.get("/message/{message_id}")
async def message_page(message_id: str):
    return FileResponse(FRONTEND_DIR / "message.html")

@router.get("/not-found")
async def not_found_page():
    return FileResponse(FRONTEND_DIR / "not-found.html")

@router.get("/stats")
async def stats_page():
    return FileResponse(FRONTEND_DIR / "stats.html")

# Add static files route
@router.get("/static/{file_path:path}")
async def static_files(file_path: str):
    return FileResponse(FRONTEND_DIR / "static" / file_path) 