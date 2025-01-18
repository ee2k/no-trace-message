from datetime import datetime, timedelta, UTC
from typing import Dict, List, Optional
from .participant import Participant
from .message import Message
from pydantic import BaseModel, Field

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
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "max_participants": self.max_participants,
            "participant_count": len(self.participants),
            "message_count": len(self.messages)
        }
