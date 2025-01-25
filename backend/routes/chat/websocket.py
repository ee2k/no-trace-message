from fastapi import WebSocket, WebSocketDisconnect
import logging
from models.chat.message import Message
from fastapi import APIRouter, Depends
from services.chat.chatroom_manager import ChatroomManager
from utils.singleton import singleton
import json
from pydantic import ValidationError
import uuid

router = APIRouter()

logger = logging.getLogger(__name__)

chatroom_manager = ChatroomManager()

@singleton
class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.room_participants: dict[str, set[str]] = {}
        self.pending_messages: dict[str, list[Message]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.room_participants.setdefault(room_id, set()).add(user_id)
        
        # Send any pending messages
        if room_id in self.pending_messages:
            for message in self.pending_messages[room_id]:
                await self.send_message(room_id, message)

    async def disconnect(self, user_id: str, room_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            if room_id in self.room_participants and user_id in self.room_participants[room_id]:
                self.room_participants[room_id].remove(user_id)
            logger.info(f"WebSocket disconnected for user {user_id} in room {room_id}")

    async def send_message(self, room_id: str, message: Message):
        participants = self.room_participants.get(room_id, set())
        
        for user_id in participants:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_text(message.json())
                message.mark_delivered(user_id)
        
        # Remove message if delivered to all
        if message.is_delivered_to_all(participants):
            if room_id in self.pending_messages:
                self.pending_messages[room_id] = [
                    msg for msg in self.pending_messages[room_id]
                    if msg.message_id != message.message_id
                ]

websocket_manager = WebSocketManager()

@router.websocket("/chatroom/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    user_id = None  # Initialize user_id here
    try:
        await websocket.accept()
        
        # Get token only if required for the room
        token = None
        if await chatroom_manager.room_requires_token(room_id):
            token = websocket.query_params.get("token") or websocket.cookies.get("chat_token")
            if not token:
                await websocket.close(code=4003, reason="Token required for this room")
                return
            if not await chatroom_manager.validate_room_token(room_id, token):
                await websocket.close(code=4003, reason="Invalid token")
                return

        # Get or create user ID
        user_id = websocket.query_params.get("user_id")
        if not user_id:
            user_id = str(uuid.uuid4())  # Generate new user ID
            await websocket.send_json({
                "type": "user_created",
                "user_id": user_id
            })

        await websocket_manager.connect(websocket, room_id, user_id)
        
        # Main message loop
        while True:
            data = await websocket.receive_text()
            message = Message.model_validate_json(data)
            
            # Validate message ownership
            if message.sender_id != user_id:
                await websocket.send_json({
                    "error": "User ID mismatch",
                    "code": "AUTH_FAILURE"
                })
                continue
                
            # Broadcast to room participants
            await websocket_manager.send_message(room_id, message)

    except WebSocketDisconnect:
        print(f"Client {user_id} disconnected from room {room_id}")
    except json.JSONDecodeError:
        await websocket.send_json({
            "error": "Invalid message format",
            "code": "INVALID_PAYLOAD"
        })
    except ValidationError as e:
        await websocket.send_json({
            "error": "Message validation failed",
            "details": str(e),
            "code": "VALIDATION_ERROR"
        })
    except Exception as e:
        print(f"Unexpected error in room {room_id}: {str(e)}")
        await websocket.close(code=1011, reason="Internal server error")
    finally:
        await websocket_manager.disconnect(user_id, room_id)
        await websocket.close() 