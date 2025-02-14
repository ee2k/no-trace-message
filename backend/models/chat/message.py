from pydantic import BaseModel, Field, model_validator
from datetime import datetime, timedelta, UTC
from enum import Enum, auto
from utils.chat_error_codes import ChatErrorCodes
from utils.constants import MAX_IMAGE_SIZE

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

    def mark_delivered(self, user_id: str) -> None:
        self.delivered_to.add(user_id)

    def is_delivered_to_all(self, participants: set[str]) -> bool:
        return self.delivered_to.issuperset(participants)

class OutboundMessage(Message):
    required_recipients: set[str] = Field(default_factory=set)
    delivered_to: set[str] = Field(default_factory=set)
    expires_at: datetime = Field(default_factory=lambda: datetime.now(UTC) + timedelta(minutes=5))

    def mark_delivered(self, user_id: str) -> None:
        self.delivered_to.add(user_id)

    def is_delivered_to_all(self, participants: set[str]) -> bool:
        return self.delivered_to.issuperset(participants)

class ImageMessage(OutboundMessage):
    image_data: bytes = Field(exclude=True)
    loaded_recipients: set[str] = Field(default_factory=set, exclude=True)
    content_type: str = Field(default="image")

    @model_validator(mode='before')
    @classmethod
    def validate_size(cls, data: dict) -> dict:
        if len(data.get('image_data', b'')) > MAX_IMAGE_SIZE:
            raise ValueError(ChatErrorCodes.IMAGE_TOO_LARGE)
        return data

    def mark_loaded(self, user_id: str):
        self.loaded_recipients.add(user_id)