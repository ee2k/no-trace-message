from fastapi import WebSocket, WebSocketDisconnect
import logging
from models.chat.message import Message
from fastapi import APIRouter, Depends
from services.chat.chatroom_manager import ChatroomManager
from utils.singleton import singleton
import json
import uuid
from starlette.websockets import WebSocketState
import time
import asyncio
from utils.chat_error_codes import ChatErrorCodes
from utils.error_codes import CommonErrorCodes
from services.chat.chatroom_manager import RoomExpiredError

router = APIRouter()

logger = logging.getLogger(__name__)

chatroom_manager = ChatroomManager()

@singleton
class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.room_participants: dict[str, set[str]] = {}
        self.pending_messages: dict[str, list[Message]] = {}
        self.last_pong_times: dict[str, float] = {}  # Track last pong times

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

    async def check_connections(self):
        """Periodically check connection health"""
        while True:
            current_time = time.time()
            for user_id, last_pong in list(self.last_pong_times.items()):
                if current_time - last_pong > 60:  # 60 seconds timeout
                    await self.disconnect(user_id)
            await asyncio.sleep(30)  # Check every 30 seconds

websocket_manager = WebSocketManager()

@router.websocket("/chatroom/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    user_id = None
    try:
        await websocket.accept()
        
        # Validate room exists
        room = await chatroom_manager.get_room(room_id)
        if room is None:
            logger.info(f"Room not found: {room_id}")
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
                message = json.loads(data)
                
                # Handle ping/pong
                if message.get('message_type') == 'ping':
                    await websocket.send_json({
                        'message_type': 'pong',
                        'content_type': 'text',
                        'content': ''
                    })
                    continue
            
                # Validate message
                validated_message = Message.model_validate_json(data)
                
                # Handle different message types
                if validated_message.message_type == 'chat':
                    # Process chat message
                    if validated_message.sender_id != user_id:
                        continue
                    await websocket_manager.send_message(room_id, validated_message)
                    
                elif validated_message.message_type == 'system':
                    # Process system message
                    await websocket_manager.broadcast_system_message(
                        room_id,
                        validated_message.content
                    )
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                continue

    except RoomExpiredError as e:
        logger.info(f"Room expired: {room_id}")
        await websocket.send_json({
            "type": "error",
            "code": ChatErrorCodes.ROOM_EXPIRED,
            "message": "The requested chat room has expired"
        })
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "code": CommonErrorCodes.SERVER_ERROR,
            "message": "An unexpected error occurred"
        })
    finally:
        try:
            if user_id:
                await websocket_manager.disconnect(user_id, room_id)
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close()
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")