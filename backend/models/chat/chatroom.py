from datetime import datetime, UTC
from typing import List, Optional
from .message import Message
from pydantic import BaseModel, Field, validator, model_validator
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
    room_id: str

class LeaveResponse(BaseModel):
    status: str

class DeleteResponse(BaseModel):
    status: str

class JoinRequest(BaseModel):
    room_id: str
    user: User
    token: Optional[str] = None

class PrivateRoom(BaseModel):
    room_id: str
    room_token: Optional[str] = None
    room_token_hint: Optional[str] = None
    participants: List[User] = []
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: Optional[datetime] = None
    max_participants: int = 6

    @model_validator(mode='before')
    def validate_room(cls, values):
        if values.get('room_id') is None:
            raise ValueError("room_id is required")
        return values

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

    @model_validator(mode='after')
    def validate_token_with_hint(self) -> 'PrivateRoom':
        token = self.room_token
        hint = self.room_token_hint
        
        if hint and not token:
            raise ValueError("Token hint cannot exist without a token")
        return self

    def add_participant(self, user: User) -> bool:
        if len(self.participants) >= self.max_participants:
            return False
        self.participants.append(user)
        return True

    def remove_participant(self, user_id: str) -> bool:
        # Use list comprehension to find matching user
        matching_users = [user for user in self.participants if user.user_id == user_id]
        if not matching_users:
            return False
        self.participants.remove(matching_users[0])
        return True

    def add_message(self, message: Message) -> None:
        self.messages.append(message)

    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False  # Room never expires if expires_at is None
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

class ValidateAccessRequest(BaseModel):
    room_id: str
    token: Optional[str] = None
