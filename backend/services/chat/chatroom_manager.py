from models.chat.chatroom import PrivateRoom
from utils.num_generator import generate_id
from datetime import datetime, UTC
from typing import Dict, Optional
import secrets
import string
from models.chat.message import Message, MessageType
from models.chat.user import User, ParticipantStatus
from fastapi import HTTPException
from utils.singleton import singleton
import time
from utils.error import Coded_Error
from utils.chat_error_codes import ChatErrorCodes, STATUS_CODES

@singleton
class ChatroomManager:
    def __init__(self):
        self._id_chars = string.ascii_letters + string.digits
        self._max_collision_attempts = 3
        self._max_rooms = 10000
        self._min_room_id_length = 1
        self._max_room_id_length = 70
        self._max_message_chars = 2000
        self._max_image_size_bytes = 3 * 1024 * 1024  # 3MB
        self._max_messages_per_room = 100
        self.ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
        self.rooms = {}
        self.recent_disconnects = {}  # {room_id: {user_id: (username, disconnect_time)}}

    async def create_private_room(self, room_id: Optional[str] = None, room_token: Optional[str] = None, room_token_hint: Optional[str] = None) -> PrivateRoom:
        """Create a private chat room with optional custom ID"""
        if len(self.rooms) >= self._max_rooms:
            raise Coded_Error(ChatErrorCodes.MEMORY_LIMIT, STATUS_CODES[ChatErrorCodes.MEMORY_LIMIT])
            
        # Create room with validation handled by PrivateRoom class
        room = PrivateRoom(
            room_id=room_id or generate_id(length=16, exists_check=lambda id: id in self.rooms),
            room_token=room_token,
            room_token_hint=room_token_hint
        )
        
        self.rooms[room.room_id] = room
        return room

    async def validate_room_token(self, room_id: str, token: str) -> bool:
        """Validate room token"""
        room = await self.get_room(room_id)
        is_valid = secrets.compare_digest(token, room.room_token)
        print(f"[Token Validation] Room: {room_id}, Token Match: {is_valid}")
        return is_valid

    def generate_private_room_token(self, room_id: str) -> str:
        """Generate a one-time token for room access"""
        room = self.get_room(room_id)            
        token = secrets.token_urlsafe(8)
        room.room_token = token
        
        return token

    def validate_private_room_token(self, room_id: str, token: str) -> bool:
        """Validate a room token"""
        room = self.get_room(room_id)
        if not room or not room.room_token:
            return False
        return room.room_token == token

    async def add_private_room_participant(self, room_id: str, user: User) -> bool:
        """Add a participant to a room"""
        room = await self.get_room(room_id)

        if len(room.participants) >= room.max_participants:
            raise Coded_Error(ChatErrorCodes.ROOM_FULL, STATUS_CODES[ChatErrorCodes.ROOM_FULL])
        
        # Check if user is already in the room
        if any(participant.user_id == user.user_id for participant in room.participants):
            raise Coded_Error(ChatErrorCodes.USER_ID_DUPLICATE, STATUS_CODES[ChatErrorCodes.USER_ID_DUPLICATE])
        
        # Add user to the participants list
        room.participants.append(user)
        return True

    def remove_private_room_participant(self, room_id: str, user_id: str) -> bool:
        """Remove a participant from a room"""
        room = self.get_room(room_id)
        if not room:
            return False
            
        # Find and remove user by user_id
        for i, user in enumerate(room.participants):
            if user.user_id == user_id:
                del room.participants[i]
                room.last_activity = datetime.now(UTC)
                return True
        return False

    def update_private_room_activity(self, room_id: str) -> None:
        """Update room's last activity timestamp"""
        room = self.get_room(room_id)
        if room:
            room.last_activity = datetime.now(UTC)

    def delete_private_room(self, room_id: str) -> bool:
        """Delete a room"""
        if room_id in self.rooms:
            del self.rooms[room_id]
            return True
        return False

    def cleanup_inactive_rooms(self) -> None:
        """Remove expired rooms from memory"""
        current_time = datetime.now(UTC)
        expired_rooms = [
            room_id for room_id, room in self.rooms.items()
            if room.is_expired()
        ]
        
        for room_id in expired_rooms:
            del self.rooms[room_id]

    def get_memory_stats(self) -> dict:
        """Get current memory usage statistics"""
        return {
            "total_rooms": len(self.rooms),
            "active_rooms": sum(1 for r in self.rooms.values() if not r.is_expired()),
            "total_participants": sum(len(r.participants) for r in self.rooms.values()),
            "total_messages": sum(len(r.messages) for r in self.rooms.values())
        }

    def enforce_room_limits(self, room: PrivateRoom) -> None:
        """Enforce memory limits for a room"""
        # Remove oldest messages if limit exceeded
        if len(room.messages) > self._max_messages_per_room:
            room.messages = room.messages[-self._max_messages_per_room:]

    def add_message_to_room(self, room_id: str, message: Message) -> None:
        """Add message with size checks"""
        room = self.get_room(room_id)
        
        # Check message count
        if len(room.messages) >= self._max_messages_per_room:
            raise Coded_Error(ChatErrorCodes.MEMORY_LIMIT, STATUS_CODES[ChatErrorCodes.MEMORY_LIMIT])
            
        # Check message size based on type
        if message.type == MessageType.text.value:
            if len(message.content.encode('utf-8')) > (self._max_message_chars * 4):  # 4 bytes per char worst case
                raise Coded_Error(ChatErrorCodes.MESSAGE_TOO_LARGE, STATUS_CODES[ChatErrorCodes.MESSAGE_TOO_LARGE])
        elif message.type == MessageType.image.value:
            self.validate_image(message.content, message.content_type)
        
        room.messages.append(message)

    def validate_image(self, image_data: bytes, content_type: str) -> None:
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise Coded_Error(ChatErrorCodes.IMAGE_TYPE_NOT_SUPPORTED, STATUS_CODES[ChatErrorCodes.IMAGE_TYPE_NOT_SUPPORTED])
        
        if len(image_data) > self._max_image_size_bytes:
            raise Coded_Error(ChatErrorCodes.IMAGE_TOO_LARGE, STATUS_CODES[ChatErrorCodes.IMAGE_TOO_LARGE])

    async def get_room(self, room_id: str) -> Optional[PrivateRoom]:
        """Get a room by its ID"""
        room = self.rooms.get(room_id)
        if not room:
            return None
        if room.is_expired():
            del self.rooms[room_id]
            return None
        return room

    async def room_requires_token(self, room_id: str) -> bool:
        """Check if room requires a token"""
        room = await self.get_room(room_id)
        return room and bool(room.room_token)

    async def handle_disconnect(self, room_id: str, user_id: str, username: str):
        """Track disconnected users"""
        if room_id not in self.recent_disconnects:
            self.recent_disconnects[room_id] = {}
        
        self.recent_disconnects[room_id][user_id] = (
            username,
            time.time()
        )
        # Cleanup old entries
        self.recent_disconnects[room_id] = {
            uid: (uname, t) 
            for uid, (uname, t) in self.recent_disconnects[room_id].items()
            if (time.time() - t) < 60  # 60-second window
        }

    async def validate_reconnection(self, room_id: str, claimed_user_id: str, username: str) -> bool:
        """
        Validate if a user with the claimed_user_id and matching username already exists in the room.
        If yes, then it is a reconnection attempt.
        """
        room = await self.get_room(room_id)
        if not room:
            return False
        for participant in room.participants:
            if participant.user_id == claimed_user_id and participant.username == username:
                return True
        return False
