from datetime import datetime
from typing import Dict, Optional
import asyncio

class MessageStore:
    def __init__(self):
        self.messages: Dict[str, dict] = {}
        self.cleanup_task = asyncio.create_task(self._cleanup_expired())
    
    async def store_message(self, message: dict) -> None:
        self.messages[message['id']] = message
    
    async def get_message(self, message_id: str, token: str) -> Optional[dict]:
        message = self.messages.get(message_id)
        if not message or message['access_token'] != token:
            return None
        return message
    
    async def delete_message(self, message_id: str) -> None:
        if message_id in self.messages:
            del self.messages[message_id]
    
    async def _cleanup_expired(self) -> None:
        while True:
            now = datetime.now()
            expired = [
                msg_id for msg_id, msg in self.messages.items()
                if msg['expires_at'] <= now or 
                (msg['is_read'] and msg['burn_time'] > 0)
            ]
            for msg_id in expired:
                await self.delete_message(msg_id)
            await asyncio.sleep(60)  # Check every minute