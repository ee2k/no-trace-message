from typing import Dict, Optional
import asyncio
from models.message import Message

class MessageStore:
    def __init__(self):
        self.messages: Dict[str, Message] = {}
        self.cleanup_task = asyncio.create_task(self._cleanup_expired())
    
    async def store_message(self, message: Message) -> None:
        self.messages[message.id] = message
    
    async def get_message(self, message_id: str, token: str) -> Optional[Message]:
        message = self.messages.get(message_id)
        if not message:
            return None
        if message.token and message.token != token:  # Only check token if message has one
            return None
        return message
    
    async def delete_message(self, message_id: str) -> None:
        if message_id in self.messages:
            del self.messages[message_id]
    
    async def _cleanup_expired(self) -> None:
        while True:
            expired = [
                msg_id for msg_id, msg in self.messages.items()
                if msg.should_burn()
            ]
            for msg_id in expired:
                await self.delete_message(msg_id)
            await asyncio.sleep(60)  # Check every minute
    
    async def get_message_meta(self, message_id: str) -> Optional[Message]:
        return self.messages.get(message_id)