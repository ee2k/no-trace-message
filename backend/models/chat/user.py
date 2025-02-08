from datetime import datetime, UTC
from enum import Enum
from typing import Optional
from pydantic import BaseModel, validator, Field
import uuid
from fastapi import WebSocket
from starlette.websockets import WebSocketState

class ParticipantStatus(Enum):
    ACTIVE = "active"
    IDLE = "idle"
    OFFLINE = "offline"
    PENDING = "pending"  # For users who have room_token but haven't joined yet

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    connection_id: Optional[str] = None
    websocket: Optional[WebSocket] = None
    status: ParticipantStatus = ParticipantStatus.PENDING
    joined_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_active: datetime = Field(default_factory=lambda: datetime.now(UTC))
    # is_creator: bool = False
    # is_muted: bool = False

    model_config = {
        "use_enum_values": True,  # Serialize enums to their values
        "arbitrary_types_allowed": True  # For WebSocket field
    }

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
            self.last_active = datetime.now(UTC)

    def set_websocket(self, websocket: WebSocket) -> None:
        self.websocket = websocket
        self.connection_id = str(id(websocket))

    def clear_websocket(self) -> None:
        self.websocket = None
        self.connection_id = None

    def is_connected(self) -> bool:
        return self.websocket is not None and self.websocket.client_state == WebSocketState.CONNECTED

    def to_dict(self) -> dict:
        # return {
        #     "user_id": self.user_id,
        #     "username": self.username,
        #     "connection_id": self.connection_id,
        #     "status": self.status.value,
        #     "joined_at": self.joined_at.isoformat(),
        #     "last_active": self.last_active.isoformat(),
        #     "is_connected": self.is_connected()
        # }
        return self.model_dump(mode='json', exclude={'websocket'})