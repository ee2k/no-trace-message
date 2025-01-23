from datetime import datetime, UTC
from enum import Enum
from typing import Optional
from pydantic import BaseModel, validator, Field
import uuid

class ParticipantStatus(Enum):
    ACTIVE = "active"
    IDLE = "idle"
    OFFLINE = "offline"
    PENDING = "pending"  # For users who have token but haven't joined yet

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    connection_id: Optional[str] = None
    status: ParticipantStatus = ParticipantStatus.PENDING
    joined_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_active: datetime = Field(default_factory=lambda: datetime.now(UTC))
    is_creator: bool = False
    is_muted: bool = False

    @validator('username')
    def validate_username(cls, value):
        if not value or len(value.strip()) < 1:
            raise ValueError('Username cannot be empty')
        if len(value) > 35:
            raise ValueError('Username cannot be longer than 35 characters')
        return value.strip()

    def update_status(self, status: ParticipantStatus) -> None:
        self.status = status
        if status == ParticipantStatus.ACTIVE:
            self.last_active = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "username": self.username,
            "connection_id": self.connection_id,
            "status": self.status.value,
            "joined_at": self.joined_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "is_creator": self.is_creator,
            "is_muted": self.is_muted
        }