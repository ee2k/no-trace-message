from fastapi import APIRouter
from models.enums import APITags
from routes.message.message import router as message_router

api_router = APIRouter(prefix="/api")

# Include sub-routers
api_router.include_router(message_router, prefix="/message", tags=[APITags.MESSAGE]) 