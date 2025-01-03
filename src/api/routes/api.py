from fastapi import APIRouter
from . import APITags
from .private.room import router as room_router
from .chat.chat import router as chat_router

api_router = APIRouter(prefix="/api")

# Include sub-routers
api_router.include_router(room_router, prefix="/rooms", tags=[APITags.ROOMS])
api_router.include_router(chat_router, prefix="/chat", tags=[APITags.CHAT]) 