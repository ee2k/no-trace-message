from fastapi import APIRouter, HTTPException
from models.chat.chatroom import CreateRoomRequest, CreateRoomResponse, RoomValidationRequest, RoomValidationResponse, RoomStatusResponse, InviteResponse, JoinResponse, LeaveResponse, DeleteResponse, JoinRequest
from services.chat.chatroom_manager import ChatroomManager
from utils.chat_error_codes import ChatErrorCodes, STATUS_CODES
import logging
from utils.error_codes import CommonErrorCodes
from utils.error import Coded_Error
import uuid
from models.chat.user import User

logger = logging.getLogger(__name__)

router = APIRouter()
private_room_manager = ChatroomManager()

@router.post("/create", response_model=CreateRoomResponse)
async def create_private_room(request: CreateRoomRequest):
    try:
        # Create room with optional custom ID
        room = await private_room_manager.create_private_room(
            room_id=request.room_id,
            room_token=request.room_token,
            room_token_hint=request.room_token_hint
        )
        
        return CreateRoomResponse(
            room_id=room.room_id,
            room_token=room.room_token,
            room_token_hint=room.room_token_hint
        )
        
    except ValueError as e:
        error_code = ChatErrorCodes.INVALID_ROOM_ID
        if "room_token" in str(e):
            error_code = ChatErrorCodes.INVALID_TOKEN
        elif "hint" in str(e):
            error_code = ChatErrorCodes.INVALID_TOKEN_HINT
            
        raise HTTPException(
            status_code=STATUS_CODES[error_code],
            detail={"code": error_code.value}
        )
    except MemoryError:
        raise HTTPException(
            status_code=STATUS_CODES[ChatErrorCodes.MEMORY_LIMIT],
            detail={"code": ChatErrorCodes.MEMORY_LIMIT.value}
        )
    except Exception as e:
        logger.error(f"Error creating room: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[CommonErrorCodes.SERVER_ERROR],
            detail={"code": CommonErrorCodes.SERVER_ERROR.value}
        )

@router.post("/validate", response_model=RoomValidationResponse)
async def validate_private_room(request: RoomValidationRequest):
    try:
        if not await private_room_manager.validate_private_room_token(request.room_id, request.room_token):
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_TOKEN],
                detail={"code": ChatErrorCodes.INVALID_TOKEN.value}
            )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error validating room: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[CommonErrorCodes.SERVER_ERROR],
            detail={"code": CommonErrorCodes.SERVER_ERROR.value}
        )

@router.get("/{room_id}/status", response_model=RoomStatusResponse)
async def get_private_room_status(room_id: str):
    try:
        status = await private_room_manager.get_room_status(room_id)
        if not status:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.ROOM_NOT_FOUND],
                detail={"code": ChatErrorCodes.ROOM_NOT_FOUND.value}
            )
        return status
    except Exception as e:
        logger.error(f"Error getting room status: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[CommonErrorCodes.SERVER_ERROR],
            detail={"code": CommonErrorCodes.SERVER_ERROR.value}
        )

@router.post("/{room_id}/invite", response_model=InviteResponse)
async def generate_private_room_invite(room_id: str, creator_token: str):
    try:
        room_token = await private_room_manager.generate_invite_token(room_id, creator_token)
        return {"room_token": room_token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/join", response_model=JoinResponse)
async def join_private_room(request: JoinRequest):
    try:
        # Validate room ID and get room
        if not request.room_id or len(request.room_id.strip()) < 1:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_ROOM_ID],
                detail={"code": ChatErrorCodes.INVALID_ROOM_ID.value}
            )
        
        room = await private_room_manager.get_room(request.room_id)

        # Add a check for room existence
        if room is None:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.ROOM_NOT_FOUND],
                detail={"code": ChatErrorCodes.ROOM_NOT_FOUND.value}
            )
        
        # Validate room_token if required
        if room.requires_token() and room.room_token != request.room_token:
            raise HTTPException(
                status_code=STATUS_CODES[ChatErrorCodes.INVALID_TOKEN],
                detail={"code": ChatErrorCodes.INVALID_TOKEN.value}
            )
        
        # Create user and add participant
        user = User(
            user_id=str(uuid.uuid4()),
            username=request.user.username
        )
        
        await private_room_manager.add_private_room_participant(request.room_id, user)
        
        return JoinResponse(
            status="ok", 
            room_id=room.room_id,
            user_id=user.user_id
        )
    except HTTPException:
        raise
    except Coded_Error as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict()
        )
    except Exception as e:
        logger.error(f"Error joining room {request.room_id}: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[CommonErrorCodes.SERVER_ERROR],
            detail={"code": CommonErrorCodes.SERVER_ERROR.value}
        )

@router.post("/{room_id}/leave", response_model=LeaveResponse)
async def leave_private_room(room_id: str, username: str):
    if not await private_room_manager.remove_private_room_participant(room_id, username):
        raise HTTPException(status_code=400, detail="User not found in room")
    return {"status": "ok"}

@router.delete("/{room_id}", response_model=DeleteResponse)
async def delete_private_room(room_id: str):
    # check privilege first
    if not await private_room_manager.delete_private_room(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    return {"status": "ok"}

@router.get("/{room_id}/meta")
async def get_private_room_meta(room_id: str):
    try:
        room = await private_room_manager.get_room(room_id)
        if not room:
            raise HTTPException(status_code=404, detail={"code": ChatErrorCodes.ROOM_NOT_FOUND.value})
            
        return {
            "token_required": room.requires_token(),
            "token_hint": room.room_token_hint if room.requires_token() else None
        }
    except HTTPException:
        raise
    except Coded_Error as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except Exception as e:
        logger.error(f"Error fetching room metadata: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": CommonErrorCodes.SERVER_ERROR.value})