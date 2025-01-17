from fastapi import APIRouter, HTTPException
from models.chat.room import CreateRoomRequest, CreateRoomResponse, RoomValidationRequest
from services.chat.room_manager import PrivateRoomManager

router = APIRouter()
private_room_manager = PrivateRoomManager()

async def create_private_room(request: CreateRoomRequest):
    try:
        room = await private_room_manager.create_private_room(request.username)
        token = await private_room_manager.generate_private_room_token(room.id)
        return CreateRoomResponse(room_id=room.id, token=token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

async def validate_private_room(request: RoomValidationRequest):
    if not await private_room_manager.validate_private_room_token(request.room_id, request.token):
        raise HTTPException(status_code=403, detail="Invalid or expired token")
    return {"status": "ok"}

async def get_private_room_status(room_id: str):
    status = await private_room_manager.get_room_status(room_id)
    if not status:
        raise HTTPException(status_code=404, detail="Room not found")
    return status

async def generate_private_room_invite(room_id: str, creator_token: str):
    try:
        token = await private_room_manager.generate_invite_token(room_id, creator_token)
        return {"token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

async def join_private_room(room_id: str, username: str):
    if not await private_room_manager.add_private_room_participant(room_id, username, "pending"):
        raise HTTPException(status_code=400, detail="Room is full or doesn't exist")
    return {"status": "ok"}

async def leave_private_room(room_id: str, username: str):
    if not await private_room_manager.remove_private_room_participant(room_id, username):
        raise HTTPException(status_code=400, detail="User not found in room")
    return {"status": "ok"}

async def delete_private_room(room_id: str):
    if not await private_room_manager.delete_private_room(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    return {"status": "ok"}

# Route definitions
router.post("/create", response_model=CreateRoomResponse)(create_private_room)
router.post("/validate")(validate_private_room)
router.get("/{room_id}/status")(get_private_room_status)
router.post("/{room_id}/invite")(generate_private_room_invite)
router.delete("/{room_id}")(delete_private_room)
router.post("/{room_id}/join")(join_private_room)
router.post("/{room_id}/leave")(leave_private_room)