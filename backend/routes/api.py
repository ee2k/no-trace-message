from fastapi import APIRouter
from models.enums import APITags
from routes.message.message import router as message_router
from services.statistics import Statistics
# import os

# API_PREFIX = "/api" if os.getenv("ENVIRONMENT") == "development" else ""
# api_router = APIRouter(prefix=API_PREFIX)

api_router = APIRouter()

# Include sub-routers
api_router.include_router(message_router, prefix="/message", tags=[APITags.MESSAGE]) 

@api_router.get("/stats")
async def get_stats():
    return Statistics().get_stats()