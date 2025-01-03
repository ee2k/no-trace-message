from datetime import datetime
from enum import Enum
from typing import Optional, Union
from dataclasses import dataclass

class MessageType(Enum):
    TEXT = "text"
    IMAGE = "image"
    SYSTEM = "system"  # For system notifications

# once message is deleted or burnt, delete the content from both server side and client side
@dataclass
class Message:
    id: str
    sender: str
    content: Union[str, bytes]  # str for text, bytes for image
    type: MessageType
    sent_at: datetime
    expires_at: Optional[datetime] = None
    is_deleted: bool = False
    is_invisible: bool = False
    burn: float = 0 # 0 or negative: not to be burned, positive: seconds to burn

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "sender": self.sender,
            "content": self.content if self.type == MessageType.TEXT else None,
            "type": self.type.value,
            "sent_at": self.sent_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_deleted": self.is_deleted,
            "is_invisible": self.is_invisible,
            "burn": self.burn
        }
