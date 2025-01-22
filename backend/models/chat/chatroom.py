from datetime import datetime, timedelta, UTC
from typing import Dict, List, Optional
from .participant import Participant
from .message import Message
from pydantic import BaseModel, Field, validator, root_validator
from .user import User

class CreateRoomRequest(BaseModel):
    room_id: Optional[str] = Field(None, description="Custom Chatroom ID")
    room_token: Optional[str] = Field(None, description="Access Token")
    room_token_hint: Optional[str] = None

class CreateRoomResponse(BaseModel):
    room_id: str
    room_token: Optional[str] = None
    room_token_hint: Optional[str] = None

class RoomValidationRequest(BaseModel):
    room_id: str
    room_token: str

class RoomValidationResponse(BaseModel):
    status: str

class RoomStatusResponse(BaseModel):
    status: str

class InviteResponse(BaseModel):
    token: str

class JoinResponse(BaseModel):
    status: str

class LeaveResponse(BaseModel):
    status: str

class DeleteResponse(BaseModel):
    status: str

class JoinRequest(BaseModel):
    room_id: str
    user: User
    token: Optional[str] = None

class PrivateRoom:
    def __init__(
        self,
        room_id: str,
        max_participants: int = 6,
        lifetime_minutes: int = 60
    ):
        self.room_id: str = room_id
        self.created_at: datetime = datetime.now(UTC)
        self.expires_at: datetime = self.created_at + timedelta(minutes=lifetime_minutes)
        self.max_participants: int = max_participants
        self.participants: Dict[str, Participant] = {}
        self.messages: List[Message] = []
        self.room_token: Optional[str] = None
        self.room_token_hint: Optional[str] = None

    @validator('room_id')
    def validate_room_id(cls, value):
        if not value:
            raise ValueError("Room ID cannot be empty")
        if len(value) < 1 or len(value) > 70:
            raise ValueError("Room ID must be between 1 and 70 characters")
        if any(ord(c) < 32 for c in value):
            raise ValueError("Room ID contains invalid characters")
        return value.strip()

    @validator('room_token')
    def validate_room_token(cls, value):
        if value is not None:
            if len(value) < 1:
                raise ValueError("Token cannot be empty")
            if len(value) > 70:
                raise ValueError("Token cannot exceed 70 characters")
            if any(ord(c) < 32 for c in value):
                raise ValueError("Token contains invalid characters")
        return value

    @validator('room_token_hint')
    def validate_room_token_hint(cls, value):
        if value is not None:
            if len(value) > 70:
                raise ValueError("Token hint cannot exceed 70 characters")
        return value

    @root_validator
    def validate_token_with_hint(cls, values):
        token = values.get('room_token')
        hint = values.get('room_token_hint')
        
        if hint and not token:
            raise ValueError("Token hint cannot exist without a token")
        return values

    def add_participant(self, participant: Participant) -> bool:
        if len(self.participants) >= self.max_participants:
            return False
        self.participants[participant.username] = participant
        return True

    def remove_participant(self, username: str) -> bool:
        if username in self.participants:
            del self.participants[username]
            return True
        return False

    def add_message(self, message: Message) -> None:
        self.messages.append(message)

    def is_expired(self) -> bool:
        return datetime.now(UTC) > self.expires_at

    def to_dict(self) -> dict:
        return {
            "room_id": self.room_id,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "max_participants": self.max_participants,
            "participant_count": len(self.participants),
            "message_count": len(self.messages)
        }
