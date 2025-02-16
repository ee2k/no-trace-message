from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from constants import CONTENT_TYPE, APPLICATION_JSON
from services.chat.chatroom_manager import RoomNotFoundError, ChatroomManager
from models.chat.chatroom import ValidateAccessRequest

router = APIRouter()

chatroom_manager = ChatroomManager()

@router.post("/validate_access")
async def validate_access(request: ValidateAccessRequest):
    try:
        room = await chatroom_manager.get_room(request.room_id)
        
        # If room requires room_token but none provided
        if room.room_token and not request.room_token:
            raise HTTPException(
                status_code=400,
                detail={"code": "TOKEN_REQUIRED", "message": "This room requires a room_token"}
            )
            
        # If room_token is provided but invalid
        if request.room_token and not await chatroom_manager.validate_room_token(request.room_id, request.room_token):
            raise HTTPException(
                status_code=400,
                detail={"code": "INVALID_TOKEN", "message": "Invalid access room_token"}
            )
            
        return {"status": "ok"}
    except RoomNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"code": "ROOM_NOT_FOUND", "message": "Room not found"}
        )

# Error handler
@router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
        headers={CONTENT_TYPE: APPLICATION_JSON}
    )