from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from auth.dependencies import get_current_user
from utils.chat_error_codes import ChatErrorCodes, STATUS_CODES
from utils.exceptions import APIException
from .websocket import websocket_endpoint
from utils.constants import code, message, status, ok, Authorization, CONTENT_TYPE

router = APIRouter()

# Register WebSocket route
router.websocket("/ws/{room_id}")(websocket_endpoint)

@router.get("/{room_id}/history", headers={Authorization: "Bearer token"})
async def get_chat_history(room_id: str, user = Depends(get_current_user)):
    """Get chat history"""
    try:
        # History implementation
        return JSONResponse(
            content={status: ok},
            headers={CONTENT_TYPE: "application/json"}
        )
    except APIException as e:
        raise HTTPException(
            status_code=STATUS_CODES.get(e.code, 500),
            detail={code: e.code, message: e.message}
        )

@router.put("/{room_id}/messages/{message_id}/read")
async def update_read_status(room_id: str, message_id: str, user = Depends(get_current_user)):
    """Update message read status"""
    try:
        # Read status implementation
        return JSONResponse(
            content={status: ok},
            headers={CONTENT_TYPE: "application/json"}
        )
    except APIException as e:
        raise HTTPException(
            status_code=STATUS_CODES.get(e.code, 500),
            detail={code: e.code, message: e.message}
        )

@router.post("/{room_id}/typing")
async def update_typing_status(room_id: str, user = Depends(get_current_user)):
    """Update typing status"""
    try:
        # Typing status implementation
        return JSONResponse(
            content={status: ok},
            headers={CONTENT_TYPE: "application/json"}
        )
    except APIException as e:
        raise HTTPException(
            status_code=STATUS_CODES.get(e.code, 500),
            detail={code: e.code, message: e.message}
        )

# Error handler
@router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
        headers={CONTENT_TYPE: "application/json"}
    )