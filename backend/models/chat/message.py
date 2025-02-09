from pydantic import BaseModel, Field
from datetime import datetime, UTC
from enum import Enum, auto
from pydantic import validator
from utils.error import Coded_Error
from utils.chat_error_codes import ChatErrorCodes, STATUS_CODES

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

class ImageMessage(Message):
    image_data: bytes
    required_recipients: set[str]
    loaded_recipients: set[str] = Field(default_factory=set)
    expires_at: datetime

    def mark_loaded(self, user_id: str):
        self.loaded_recipients.add(user_id)

    @validator('image_data')
    def validate_image(cls, v):
        if len(v) > 3 * 1024 * 1024:
            raise ValueError(ChatErrorCodes.IMAGE_TOO_LARGE)
        return v