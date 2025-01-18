from pydantic import BaseModel
from datetime import datetime
from enum import Enum, auto

class Message(BaseModel):
    message_id: str
    message_content: str
    message_timestamp: datetime
    message_sender: str
    message_receiver: str

class MessageType(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name

    text = auto()
    image = auto()