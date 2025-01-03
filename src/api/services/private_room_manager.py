from api.models.private_room import PrivateRoom
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional
import secrets
import string
from api.models.message import Message, MessageType
from sys import getsizeof

class RoomError(Exception):
    """Base exception for room operations"""
    pass

class RoomNotFoundError(RoomError):
    """Room does not exist"""
    pass

class RoomFullError(RoomError):
    """Room has reached capacity"""
    pass

class RoomExpiredError(RoomError):
    """Room has expired"""
    pass

class MemoryLimitError(RoomError):
    """Memory limit reached"""
    pass

class PrivateRoomManager:
    def __init__(self):
        # Store all rooms in memory using a dictionary
        self._rooms: Dict[str, PrivateRoom] = {}
        self._id_chars = string.ascii_letters + string.digits
        self._max_collision_attempts = 10  # Prevent infinite loop
        self._max_rooms = 10000  # Maximum number of rooms
        self._max_messages_per_room = 1000  # Message limit
        self._max_message_size_bytes = 3 * 1024 * 1024  # 3MB per message (for images)
        self._max_participants_per_room = 6  # Maximum number of participants
        self._max_pictures_per_room = 10  # Maximum number of pictures per room
        self._max_message_chars = 2000  # Maximum characters per text message
    
    def create_private_room(self) -> PrivateRoom:
        """Create a private chat room with memory checks"""
        if len(self._rooms) >= self._max_rooms:
            raise MemoryError("Maximum room limit reached")
        attempts = 0
        
        while attempts < self._max_collision_attempts:
            room_id = ''.join(secrets.choice(self._id_chars) for _ in range(8))
            if room_id not in self._rooms:
                room = PrivateRoom(
                    room_id=room_id,
                    created_at=datetime.utcnow(),
                )
                self._rooms[room_id] = room
                return room
            attempts += 1
            
        raise RuntimeError("Failed to generate unique room ID after multiple attempts")

    def generate_private_room_token(self, room_id: str, expiry_minutes: int = 60) -> str:
        """Generate a one-time token for room access"""
        room = self.get_private_room(room_id)
        if not room:
            raise ValueError("Room not found")
            
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow().timestamp() + (expiry_minutes * 60)
        room.tokens[token] = expiry
        
        return token

    def validate_private_room_token(self, room_id: str, token: str) -> bool:
        """Validate a room token and remove if valid"""
        room = self.get_private_room(room_id)
        if not room or token not in room.tokens:
            return False
            
        expiry = room.tokens[token]
        if datetime.utcnow().timestamp() > expiry:
            del room.tokens[token]
            return False
            
        del room.tokens[token]  # One-time use
        return True

    def add_private_room_participant(self, room_id: str, username: str, connection_id: str) -> bool:
        """Add a participant to a room"""
        room = self.get_private_room(room_id)
        if not room:
            return False
            
        if len(room.participants) >= 2:
            return False
            
        room.participants[username] = connection_id
        room.last_activity = datetime.utcnow()
        return True

    def remove_private_room_participant(self, room_id: str, username: str) -> bool:
        """Remove a participant from a room"""
        room = self.get_private_room(room_id)
        if not room or username not in room.participants:
            return False
            
        del room.participants[username]
        room.last_activity = datetime.utcnow()
        return True

    def update_private_room_activity(self, room_id: str) -> None:
        """Update room's last activity timestamp"""
        room = self.get_private_room(room_id)
        if room:
            room.last_activity = datetime.utcnow()

    def get_private_room(self, room_id: str) -> PrivateRoom:
        """Get room by ID with error handling"""
        room = self._rooms.get(room_id)
        if not room:
            raise RoomNotFoundError(f"Room {room_id} not found")
        if room.is_expired():
            raise RoomExpiredError(f"Room {room_id} has expired")
        return room

    def delete_private_room(self, room_id: str) -> bool:
        """Delete a room"""
        if room_id in self._rooms:
            del self._rooms[room_id]
            return True
        return False

    def cleanup_inactive_rooms(self) -> None:
        """Remove expired rooms from memory"""
        current_time = datetime.utcnow()
        expired_rooms = [
            room_id for room_id, room in self._rooms.items()
            if room.is_expired()
        ]
        
        for room_id in expired_rooms:
            del self._rooms[room_id]

    def get_memory_stats(self) -> dict:
        """Get current memory usage statistics"""
        return {
            "total_rooms": len(self._rooms),
            "active_rooms": sum(1 for r in self._rooms.values() if not r.is_expired()),
            "total_participants": sum(len(r.participants) for r in self._rooms.values()),
            "total_messages": sum(len(r.messages) for r in self._rooms.values())
        }

    def enforce_room_limits(self, room: PrivateRoom) -> None:
        """Enforce memory limits for a room"""
        # Remove oldest messages if limit exceeded
        if len(room.messages) > self._max_messages_per_room:
            room.messages = room.messages[-self._max_messages_per_room:]

    def add_message_to_room(self, room_id: str, message: Message) -> None:
        """Add message with size checks"""
        room = self.get_private_room(room_id)
        
        # Check message count
        if len(room.messages) >= self._max_messages_per_room:
            raise MemoryLimitError("Maximum message count reached")
            
        # Check message size based on type
        if message.type == MessageType.TEXT:
            if len(message.content.encode('utf-8')) > (self._max_message_chars * 4):  # 4 bytes per char worst case
                raise MemoryLimitError("Text message too long")
        elif message.type == MessageType.IMAGE:
            if len(message.content) > self._max_message_size_bytes:
                raise MemoryLimitError("Image size exceeds limit")
        
        room.messages.append(message)
