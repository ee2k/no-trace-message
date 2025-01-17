from fastapi import APIRouter, HTTPException
from models.chat.private_room import CreateRoomRequest, CreateRoomResponse, RoomValidationRequest, RoomValidationResponse, RoomStatusResponse, InviteResponse, JoinResponse, LeaveResponse, DeleteResponse
from services.chat.room_manager import PrivateRoomManager

router = APIRouter()
private_room_manager = PrivateRoomManager()

@router.post("/create", response_model=CreateRoomResponse)
async def create_private_room(request: CreateRoomRequest):
    try:
        room = await private_room_manager.create_private_room(request.username)
        token = await private_room_manager.generate_private_room_token(room.id)
        return CreateRoomResponse(room_id=room.id, token=token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/validate", response_model=RoomValidationResponse)
async def validate_private_room(request: RoomValidationRequest):
    if not await private_room_manager.validate_private_room_token(request.room_id, request.token):
        raise HTTPException(status_code=403, detail="Invalid or expired token")
    return {"status": "ok"}

@router.get("/{room_id}/status", response_model=RoomStatusResponse)
async def get_private_room_status(room_id: str):
    status = await private_room_manager.get_room_status(room_id)
    if not status:
        raise HTTPException(status_code=404, detail="Room not found")
    return status

@router.post("/{room_id}/invite", response_model=InviteResponse)
async def generate_private_room_invite(room_id: str, creator_token: str):
    try:
        token = await private_room_manager.generate_invite_token(room_id, creator_token)
        return {"token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{room_id}/join", response_model=JoinResponse)
async def join_private_room(room_id: str, username: str):
    if not await private_room_manager.add_private_room_participant(room_id, username, "pending"):
        raise HTTPException(status_code=400, detail="Room is full or doesn't exist")
    return {"status": "ok"}

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
