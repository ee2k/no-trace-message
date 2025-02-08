from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from auth.dependencies import get_current_user
from utils.chat_error_codes import STATUS_CODES
from utils.exceptions import APIException
from .websocket import websocket_endpoint
from constants import AUTH_HEADER, CONTENT_TYPE, APPLICATION_JSON
from services.chat.chatroom_manager import RoomNotFoundError, ChatroomManager
from models.chat.chatroom import ValidateAccessRequest

router = APIRouter()

chatroom_manager = ChatroomManager()

@router.get("/{room_id}/history", headers={AUTH_HEADER: "Bearer token"})
async def get_chat_history(room_id: str, user = Depends(get_current_user)):
    """Get chat history"""
    try:
        # History implementation
        return JSONResponse(
            content={"status": "ok"},
            headers={CONTENT_TYPE: APPLICATION_JSON}
        )
    except APIException as e:
        raise HTTPException(
            status_code=STATUS_CODES.get(e.code, 500),
            detail={"code": e.code, "message": e.message}
        )

@router.put("/{room_id}/messages/{message_id}/read")
async def update_read_status(room_id: str, message_id: str, user = Depends(get_current_user)):
    """Update message read status"""
    try:
        # Read status implementation
        return JSONResponse(
            content={"status": "ok"},
            headers={CONTENT_TYPE: APPLICATION_JSON}
        )
    except APIException as e:
        raise HTTPException(
            status_code=STATUS_CODES.get(e.code, 500),
            detail={"code": e.code, "message": e.message}
        )

@router.post("/{room_id}/typing")
async def update_typing_status(room_id: str, user = Depends(get_current_user)):
    """Update typing status"""
    try:
        # Typing status implementation
        return JSONResponse(
            content={"status": "ok"},
            headers={CONTENT_TYPE: APPLICATION_JSON}
        )
    except APIException as e:
        raise HTTPException(
            status_code=STATUS_CODES.get(e.code, 500),
            detail={"code": e.code, "message": e.message}
        )

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