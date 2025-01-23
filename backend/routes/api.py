from fastapi import APIRouter
from models.enums import APITags
from routes.message.message import router as message_router
from routes.chat.chatroom import router as private_room_router
from services.statistics import Statistics

api_router = APIRouter()

# Include sub-routers
api_router.include_router(message_router, prefix="/message", tags=[APITags.MESSAGE]) 
api_router.include_router(private_room_router, prefix="/chat/private_room", tags=[APITags.CHAT])

@api_router.get("/stats")
async def get_stats():
    return Statistics().get_stats()