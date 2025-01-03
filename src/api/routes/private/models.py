from typing import Optional
from pydantic import BaseModel

class CreateRoomRequest(BaseModel):
    room_id: Optional[str] = None
    username: Optional[str] = None

class CreateRoomResponse(BaseModel):
    room_id: str
    token: str

class RoomValidationRequest(BaseModel):
    room_id: str
    token: str
    username: str 