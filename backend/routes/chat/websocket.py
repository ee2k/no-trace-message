from fastapi import WebSocket, WebSocketDisconnect
import logging
from models.chat.message import Message
from fastapi import APIRouter, Depends
from services.chat.chatroom_manager import ChatroomManager, RoomExpiredError
from utils.singleton import singleton
import json
import uuid
from starlette.websockets import WebSocketState
import time
import asyncio
from utils.chat_error_codes import ChatErrorCodes
from utils.error_codes import CommonErrorCodes
from models.chat.user import User, ParticipantStatus
from models.chat.chatroom import PrivateRoom
from pydantic import ValidationError

router = APIRouter()

logger = logging.getLogger(__name__)

chatroom_manager = ChatroomManager()

@singleton
class WebSocketManager:
    def __init__(self):
        self.rooms: dict[str, PrivateRoom] = {}  # room_id -> PrivateRoom
        # self.active_connections: dict[str, WebSocket] = {}
        # self.room_participants: dict[str, dict[str, dict]] = {}  # room_id -> {user_id -> user_info}
        # self.pending_messages: dict[str, list[Message]] = {}
        # self.last_pong_times: dict[str, float] = {}
        # self.connection_states = {}  # user_id -> connection state

    async def connect(self, websocket: WebSocket, room_id: str, user: User):
        # Set user's WebSocket connection
        user.set_websocket(websocket)
        user.update_status(ParticipantStatus.ACTIVE)
        
        # Add to room if not already present
        if room_id not in self.rooms:
            self.rooms[room_id] = await chatroom_manager.get_room(room_id)
        
        self.rooms[room_id].add_participant(user)

    async def disconnect(self, user: User, room_id: str):
        if user.is_connected():
            user.clear_websocket()
            user.update_status(ParticipantStatus.OFFLINE)
        
        if room_id in self.rooms:
            self.rooms[room_id].remove_participant(user.user_id)

    async def send_message(self, room_id: str, message: Message):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            for participant in room.participants:
                if participant.is_connected() and participant.user_id != message.sender_id:
                    await participant.websocket.send_text(message.model_dump_json())
                    message.mark_delivered(participant.user_id)

    async def check_connections(self):
        """Periodically check connection health"""
        while True:
            current_time = time.time()
            for room in self.rooms.values():
                for participant in room.participants:
                    if participant.is_connected():
                        # Check last activity or implement ping/pong tracking
                        if current_time - participant.last_active.timestamp() > 60:
                            await self.disconnect(participant, room.room_id)
            await asyncio.sleep(30)  # Check every 30 seconds

    async def broadcast_failed_join(self, room_id: str, username: str):
        """Broadcast failed join attempt to room participants"""
        system_message = {
            "message_type": "system",
            "username": username,
            "code": ChatErrorCodes.FAILED_JOIN_ATTEMPT,
            "timestamp": time.time()
        }
        
        # Send to all participants in the room
        if room_id in self.rooms:
            room = self.rooms[room_id]
            for participant in room.participants:
                if participant.is_connected():
                    await participant.websocket.send_json(system_message)

    async def send_participant_list(self, room_id: str):
        room = self.rooms.get(room_id)
        if room:
            participants = [{"user_id": p.user_id, "username": p.username} for p in room.participants]
            await self.broadcast(room_id, {
                "type": "participant_list",
                "participants": participants
            })

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            for participant in room.participants:
                if participant.is_connected():
                    await participant.websocket.send_json(message)

    async def handle_disconnect(self, room_id: str, user_id: str, username: str):
        # Implementation of handle_disconnect method
        pass

websocket_manager = WebSocketManager()

@router.websocket("/chatroom/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    user = None
    try:
        await websocket.accept()
        
        # Get all params from query string
        username = websocket.query_params.get("username")
        token = websocket.query_params.get("token")
        claimed_user_id = websocket.query_params.get("user_id")

        # Immediate validation
        if not username:
            await websocket.close(code=4001, reason="Username required")
            return

        # Room existence check
        room = await chatroom_manager.get_room(room_id)
        if not room:
            await websocket.close(code=4004, reason="Room not found")
            return

        # Token validation for private rooms
        if room.requires_token():
            if not token or not await chatroom_manager.validate_room_token(room_id, token):
                await websocket.close(code=4003, reason="Invalid token")
            return

        # User ID handling
        user_id = claimed_user_id if await chatroom_manager.validate_reconnection(
            room_id, claimed_user_id, username
        ) else str(uuid.uuid4())

        # Create user object
        user = User(user_id=user_id, username=username)
        await websocket_manager.connect(websocket, room_id, user)
        
        # Notify client and participants
        await websocket.send_json({
            "type": "connection_info",
            "user_id": user_id,
            "participants": [
                {"user_id": p.user_id, "username": p.username}
                for p in room.participants
            ]
        })
        
        # Broadcast join notification
        await websocket_manager.broadcast(room_id, {
            "type": "participant_joined",
            "user_id": user.user_id,
            "username": user.username
        })

        # Main message loop
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle ping/pong
                if message.get('type') == 'ping':
                    await websocket.send_json({'type': 'pong'})
                    continue

                # Validate and process message
                validated = Message.model_validate(message)
                if validated.message_type == 'chat':
                    if validated.sender_id != user_id:
                        continue
                    await websocket_manager.send_message(room_id, validated)
                elif validated.message_type == 'system':
                    await websocket_manager.broadcast_system_message(
                        room_id, validated.content
                    )

            except json.JSONDecodeError:
                logger.error("Invalid JSON message")
            except ValidationError as e:
                logger.error(f"Invalid message format: {str(e)}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user_id}")
    finally:
        if user:
            # Cleanup and notifications
            await websocket_manager.disconnect(user, room_id)
            await websocket_manager.broadcast(room_id, {
                "type": "participant_left",
                "user_id": user.user_id,
                "username": user.username
            })
            await websocket_manager.send_participant_list(room_id)

def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocketManager instance"""
    return websocket_manager

def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocketManager instance"""
    return websocket_manager