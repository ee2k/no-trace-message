from fastapi import WebSocket, WebSocketDisconnect
import logging
from models.chat.message import Message
from fastapi import APIRouter, Depends
from services.chat.chatroom_manager import ChatroomManager
from utils.singleton import singleton
import json
from pydantic import ValidationError
import uuid
from starlette.websockets import WebSocketState

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
    user_id = None
    try:
        await websocket.accept()
        
        # Validate room exists
        room = await chatroom_manager.get_room(room_id)
        if not room:
            await websocket.close(code=4004, reason="Room not found")
            return

        # Get token if required
        token = None
        if room.requires_token():
            token = websocket.query_params.get("token")
            if not token or not await chatroom_manager.validate_room_token(room_id, token):
                await websocket.close(code=4003, reason="Token required/invalid")
                return

        # Generate user ID
        user_id = str(uuid.uuid4())
        await websocket.send_json({
            "type": "auth",
            "user_id": user_id
        })

        await websocket_manager.connect(websocket, room_id, user_id)
        
        # Main message loop
        while True:
            try:
                data = await websocket.receive_text()
                message = Message.model_validate_json(data)
                
                if message.sender_id != user_id:
                    continue
                    
                await websocket_manager.send_message(room_id, message)
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                continue

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        try:
            if user_id:
                await websocket_manager.disconnect(user_id, room_id)
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close()
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}") 