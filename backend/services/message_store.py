from typing import Dict, Optional, AsyncGenerator, Any
import asyncio
from models.burning_message import BurningMessage
import time
from services.statistics import Statistics

class MessageStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.messages = {}
            cls._instance.failed_attempts = {}
            cls._instance.cleanup_task = None
        return cls._instance

    async def initialize(self) -> None:
        """Initialize the message store and start cleanup task"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_expired())

    async def cleanup(self) -> None:
        """Cleanup resources"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None

    async def check_health(self) -> dict:
        """Check store health"""
        return {
            "message_count": len(self.messages),
            "cleanup_task_running": self.cleanup_task is not None and not self.cleanup_task.done()
        }

    async def store_message(self, message: BurningMessage) -> None:
        self.messages[message.id] = message
        Statistics().increment_messages_created()
    
    async def get_message(self, message_id: str, room_token: str) -> Optional[BurningMessage]:
        message = self.messages.get(message_id)
        if not message:
            return None
        if message.room_token and message.room_token != room_token:
            return None
        return message
    
    async def delete_message(self, message_id: str) -> None:
        if message_id in self.messages:
            del self.messages[message_id]
    
    async def _cleanup_expired(self) -> None:
        while True:
            try:
                expired = [
                    msg_id for msg_id, msg in self.messages.items()
                    if msg.should_burn()
                ]
                for msg_id in expired:
                    await self.delete_message(msg_id)
                await asyncio.sleep(60)  # Check every minute
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Cleanup error: {e}")
                await asyncio.sleep(60)

    async def check_message(self, message_id: str) -> Optional[BurningMessage]:
        """Check if message exists and return the Message object"""
        try:
            return self.messages.get(message_id)
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

    async def stream_and_delete_message(self, message_id: str) -> AsyncGenerator[bytes, None]:
        """Stream message content and delete after successful streaming"""
        try:
            message = self.messages[message_id]
            Statistics().increment_messages_read()
            async for chunk in message.stream_content():
                yield chunk
            await asyncio.sleep(0.1)  # Small delay to ensure client receives data
            await self.delete_message(message_id)
        except Exception as e:
            print(f"Error in stream_and_delete: {str(e)}")