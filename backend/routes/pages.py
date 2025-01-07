from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
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
    return FileResponse(str(FRONTEND_DIR / "create.html"))

@router.get("/success")
async def success():
    return FileResponse(str(FRONTEND_DIR / "success.html"))

@router.get("/message/{message_id}", response_class=HTMLResponse)
async def message_page(message_id: str):
    return FileResponse(FRONTEND_DIR / "message.html")

@router.get("/not-found", response_class=HTMLResponse)
async def not_found_page():
    return FileResponse(FRONTEND_DIR / "not-found.html") 