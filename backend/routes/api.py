from fastapi import APIRouter, Request
from models.enums import APITags
from routes.message.message import router as message_router
from routes.chat.room import router as room_router
from services.statistics import Statistics

api_router = APIRouter()

# Include sub-routers
api_router.include_router(message_router, prefix="/message", tags=[APITags.MESSAGE]) 
api_router.include_router(room_router, prefix="/chat/room", tags=[APITags.CHAT])

@api_router.get("/stats")
async def get_stats():
    return Statistics().get_stats()