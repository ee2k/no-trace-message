from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, HTMLResponse, StreamingResponse
from pathlib import Path
import json
from routes.message.message import message_store
import logging
import asyncio

logger = logging.getLogger(__name__)

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

router = APIRouter()

# @router.get("/")
# async def root():
#     return RedirectResponse(url="/create")

# @router.get("/create")
# async def create():
#     return FileResponse(FRONTEND_DIR / "create.html")

# @router.get("/success")
# async def success():
#     return FileResponse(FRONTEND_DIR / "success.html")

# @router.get("/not-found")
# async def not_found_page():
#     return FileResponse(FRONTEND_DIR / "not-found.html")

# @router.get("/stats")
# async def stats_page():
#     return FileResponse(FRONTEND_DIR / "stats.html")

# Add static files route
# @router.get("/static/{file_path:path}")
# async def static_files(file_path: str):
#     return FileResponse(FRONTEND_DIR / "static" / file_path)

# @router.get("/message/{message_id}")
# async def message_page(message_id: str, request: Request):
#     try:
#         # Check if message exists
#         message = await message_store.check_message(message_id)
#         if not message:
#             return RedirectResponse(url="/not-found")
            
#         # Read the base template
#         with open(FRONTEND_DIR / "message.html") as f:
#             template = f.read()

#         # Only include minimal metadata, no sensitive content
#         metadata = {
#             "needs_token": bool(message.token),
#             "token_hint": message.token_hint if message.token else None
#         }

#         # Inject metadata into template
#         content_script = f"""<script> window.messageData = {json.dumps(metadata)}; </script>"""
#         modified_template = template.replace(
#             '</head>',
#             f'{content_script}</head>'
#         )

#         return HTMLResponse(modified_template)
            
#     except Exception as e:
#         logger.error(f"Error serving message page: {str(e)}")
#         return RedirectResponse(url="/not-found")
