from typing import Dict, Optional
import asyncio
from models.message import Message
import time

class MessageStore:
    def __init__(self):
        self.messages: Dict[str, Message] = {}
        self.failed_attempts = {}  # Format: {message_id: [{timestamp: time, ip: ip}]}
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
    
    async def check_message(self, message_id: str) -> dict:
        """Check if message exists and if it needs a token"""
        try:
            message = self.messages.get(message_id)
            if not message:
                return None
            
            return {
                "needs_token": bool(message.token),
                "token_hint": message.token_hint if message.token else None
            }
        except Exception as e:
            print(f"Error in check_message: {str(e)}")
            return None
    
    async def check_token_attempts(self, message_id: str, ip: str) -> dict:
        """Check if too many failed attempts"""
        if message_id not in self.failed_attempts:
            return {"allowed": True, "wait_time": 0}
            
        attempts = self.failed_attempts[message_id]
        attempts = [a for a in attempts if a["timestamp"] > time.time() - 3600]  # Last hour
        
        if len(attempts) >= 6:  # Max 6 attempts per hour
            wait_time = min(pow(2, len(attempts) - 6) * 300, 7200)  # Exponential backoff, max 2 hours
            return {"allowed": False, "wait_time": wait_time}
            
        return {"allowed": True, "wait_time": 0}
    
    async def record_failed_attempt(self, message_id: str, ip: str):
        if message_id not in self.failed_attempts:
            self.failed_attempts[message_id] = []
        self.failed_attempts[message_id].append({
            "timestamp": time.time(),
            "ip": ip
        })