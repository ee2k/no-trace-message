from pydantic import BaseModel, Field
from datetime import datetime, UTC
from enum import Enum, auto

class ContentType(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    text = auto()
    image = auto()

class MessageType(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    chat = auto()
    system = auto()
    ping = auto()
    pong = auto()
    ack = auto()

class Message(BaseModel):
    message_id: str
    message_type: MessageType
    content_type: ContentType
    content: str
    sender_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    delivered_to: set[str] = Field(default_factory=set)

    def mark_delivered(self, user_id: str) -> None:
        self.delivered_to.add(user_id)

    def is_delivered_to_all(self, participants: set[str]) -> bool:
        return self.delivered_to.issuperset(participants)
