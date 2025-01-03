from datetime import datetime
from enum import Enum
from typing import Optional

class ParticipantStatus(Enum):
    ACTIVE = "active"
    IDLE = "idle"
    OFFLINE = "offline"
    PENDING = "pending"  # For users who have token but haven't joined yet

class Participant:
    def __init__(self, username: str):
        self.username: str = username
        self.status: ParticipantStatus = ParticipantStatus.PENDING
        self.joined_at: datetime = datetime.utcnow()
        self.last_active: datetime = datetime.utcnow()
        self.is_creator: bool = False
        self.is_muted: bool = False

    def update_status(self, status: ParticipantStatus) -> None:
        self.status = status
        if status == ParticipantStatus.ACTIVE:
            self.last_active = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "username": self.username,
            "status": self.status.value,
            "joined_at": self.joined_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "is_creator": self.is_creator,
            "is_muted": self.is_muted
        }
