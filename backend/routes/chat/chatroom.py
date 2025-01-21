from fastapi import APIRouter, HTTPException
from models.chat.chatroom import CreateRoomRequest, CreateRoomResponse, RoomValidationRequest, RoomValidationResponse, RoomStatusResponse, InviteResponse, JoinResponse, LeaveResponse, DeleteResponse
from services.chat.chatroom_manager import ChatroomManager
from utils.chat_error_codes import ChatErrorCodes, STATUS_CODES
from utils.constants import CODE
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
private_room_manager = ChatroomManager()

@router.post("/create", response_model=CreateRoomResponse)
async def create_private_room(request: CreateRoomRequest):
    # Validate custom room ID and token if provided
    if request.room_id:
        # Remove leading/trailing whitespace
        request.room_id = request.room_id.strip()
        
        # Check minimum length after stripping
        if len(request.room_id) < 1:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_ROOM_ID],
                detail={CODE: ChatErrorCodes.INVALID_ROOM_ID.value}
            )
            
        # Check for newlines or control characters
        if any(ord(c) < 32 for c in request.room_id):
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_ROOM_ID],
                detail={CODE: ChatErrorCodes.INVALID_ROOM_ID.value}
            )
    
    if request.room_token and len(request.room_token) < 1:
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.INVALID_TOKEN],
            detail={CODE: ChatErrorCodes.INVALID_TOKEN.value}
        )

    try:
        # Create room with optional custom ID
        room = await private_room_manager.create_private_room(room_id=request.room_id)
        
        # Store token and hint if provided
        if request.room_token:
            room.room_token = request.room_token
            room.room_token_hint = request.room_token_hint
        
        return CreateRoomResponse(
            room_id=room.room_id,
            room_token=room.room_token,
            room_token_hint=room.room_token_hint
        )
        
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.ROOM_ID_EXISTS],
                detail={CODE: ChatErrorCodes.ROOM_ID_EXISTS.value}
            )
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.INVALID_ROOM_ID],
            detail={CODE: ChatErrorCodes.INVALID_ROOM_ID.value}
        )
    except MemoryError:
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.MEMORY_LIMIT],
            detail={CODE: ChatErrorCodes.MEMORY_LIMIT.value}
        )
    except Exception as e:
        logger.error(f"Error creating room: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.SERVER_ERROR],
            detail={CODE: ChatErrorCodes.SERVER_ERROR.value}
        )

@router.post("/validate", response_model=RoomValidationResponse)
async def validate_private_room(request: RoomValidationRequest):
    try:
        if not await private_room_manager.validate_private_room_token(request.room_id, request.token):
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_TOKEN],
                detail={CODE: ChatErrorCodes.INVALID_TOKEN.value}
            )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error validating room: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.SERVER_ERROR],
            detail={CODE: ChatErrorCodes.SERVER_ERROR.value}
        )

@router.get("/{room_id}/status", response_model=RoomStatusResponse)
async def get_private_room_status(room_id: str):
    try:
        status = await private_room_manager.get_room_status(room_id)
        if not status:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.ROOM_NOT_FOUND],
                detail={CODE: ChatErrorCodes.ROOM_NOT_FOUND.value}
            )
        return status
    except Exception as e:
        logger.error(f"Error getting room status: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.SERVER_ERROR],
            detail={CODE: ChatErrorCodes.SERVER_ERROR.value}
        )

@router.post("/{room_id}/invite", response_model=InviteResponse)
async def generate_private_room_invite(room_id: str, creator_token: str):
    try:
        token = await private_room_manager.generate_invite_token(room_id, creator_token)
        return {"token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{room_id}/join", response_model=JoinResponse)
async def join_private_room(room_id: str, username: str):
    try:
        if not username or len(username) < 1:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_USERNAME],
                detail={CODE: ChatErrorCodes.INVALID_USERNAME.value}
            )
            
        result = await private_room_manager.add_private_room_participant(room_id, username, "pending")
        if not result:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.ROOM_FULL],
                detail={CODE: ChatErrorCodes.ROOM_FULL.value}
            )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error joining room: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.SERVER_ERROR],
            detail={CODE: ChatErrorCodes.SERVER_ERROR.value}
        )

@router.post("/{room_id}/leave", response_model=LeaveResponse)
async def leave_private_room(room_id: str, username: str):
    if not await private_room_manager.remove_private_room_participant(room_id, username):
        raise HTTPException(status_code=400, detail="User not found in room")
    return {"status": "ok"}

@router.delete("/{room_id}", response_model=DeleteResponse)
async def delete_private_room(room_id: str):
    if not await private_room_manager.delete_private_room(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    return {"status": "ok"}

@router.get("/{room_id}/meta", response_model=dict)
async def get_room_meta(room_id: str):
    """Get room metadata including token requirement and hint"""
    try:
        room = await private_room_manager.get_room(room_id)
        if not room:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.ROOM_NOT_FOUND],
                detail={CODE: ChatErrorCodes.ROOM_NOT_FOUND.value}
            )
            
        return {
            "token_required": bool(room.room_token),
            "token_hint": room.room_token_hint if room.room_token else None
        }
        
    except Exception as e:
        logger.error(f"Error getting room metadata: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.SERVER_ERROR],
            detail={CODE: ChatErrorCodes.SERVER_ERROR.value}
        )
