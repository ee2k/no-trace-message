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
        self.room_participants: dict[str, dict[str, dict]] = {}  # room_id -> {user_id -> user_info}
        self.pending_messages: dict[str, list[Message]] = {}
        self.last_pong_times: dict[str, float] = {}
        self.connection_states = {}  # user_id -> connection state

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, username: str):
        logger.info(f"Connecting user {user_id} ({username}) to room {room_id}")
        self.active_connections[user_id] = websocket
        
        # Initialize room if not exists
        if room_id not in self.room_participants:
            logger.info(f"Initializing new room: {room_id}")
            self.room_participants[room_id] = {}
        
        # Add user to room participants
        self.room_participants[room_id][user_id] = {
            "username": username,
            "joined_at": time.time()
        }
        logger.info(f"User {user_id} added to room {room_id}")
        
        # Send current participant list to new user
        await websocket.send_json({
            "message_type": "participant_list",
            "participants": [
                {"user_id": uid, "username": info["username"]}
                for uid, info in self.room_participants[room_id].items()
            ]
        })
        
        # Notify others about new user
        for pid, participant_ws in self.active_connections.items():
            if pid != user_id and pid in self.room_participants[room_id]:
                await participant_ws.send_json({
                    "message_type": "user_joined",
                    "user": {
                        "user_id": user_id,
                        "username": username
                    }
                })

        # Track connection state
        self.connection_states[user_id] = "connected"

    async def disconnect(self, user_id: str, room_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
            if room_id in self.room_participants:
                if user_id in self.room_participants[room_id]:
                    # Remove user from room
                    username = self.room_participants[room_id][user_id]["username"]
                    del self.room_participants[room_id][user_id]
                    
                    # Notify others about user leaving
                    for pid, participant_ws in self.active_connections.items():
                        if pid in self.room_participants[room_id]:
                            await participant_ws.send_json({
                                "message_type": "user_left",
                                "user_id": user_id,
                                "username": username
                            })

        # Update connection state
        if user_id in self.connection_states:
            self.connection_states[user_id] = "disconnected"

    async def send_message(self, room_id: str, message: Message):
        participants = self.room_participants.get(room_id, set())
        
        # Send to all participants except the sender
        for user_id in participants:
            if user_id != message.sender_id and user_id in self.active_connections:
                await self.active_connections[user_id].send_text(message.model_dump_json())
                message.mark_delivered(user_id)
        
        # Send delivery acknowledgment to sender
        sender_ws = self.active_connections.get(message.sender_id)
        if sender_ws:
            await sender_ws.send_json({
                "message_type": "ack",
                "message_id": message.message_id,
                "status": "delivered"
            })

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
        logger.info(f"WebSocket connection attempt for room: {room_id}")
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for room: {room_id}")
        
        # Get username from query params
        username = websocket.query_params.get("username")
        if not username:
            logger.warning("WebSocket connection rejected: username required")
            await websocket.close(code=4002, reason="Username required")
            return

        # Validate room exists
        room = await chatroom_manager.get_room(room_id)
        if room is None:
            logger.warning(f"WebSocket connection rejected: room not found - {room_id}")
            await websocket.close(code=4004, reason="Room not found")
            return

        # Generate user ID
        user_id = str(uuid.uuid4())
        
        # Send auth response with user ID
        await websocket.send_json({
            "type": "auth",
            "user_id": user_id
        })

        # Wait for authentication message
        auth_message = await websocket.receive_text()
        try:
            message_data = json.loads(auth_message)
            if message_data.get('type') != 'auth':
                raise ValueError("First message must be authentication")
                
            token = message_data.get('token')
            
            # Validate token if required
            if room.requires_token():
                if not token:
                    raise WebSocketDisconnect(code=4003, reason="Token required")
                
                if not await chatroom_manager.validate_room_token(room_id, token):
                    logger.warning(f"Invalid token for room {room_id}")
                    await websocket.close(code=4003, reason="Invalid token")
                    return
                
                logger.info(f"Token validation successful for room: {room_id}")

        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Invalid auth message: {str(e)}")
            await websocket.close(code=4003, reason="Invalid authentication format")
            return

        # Connect to room after successful authentication
        await websocket_manager.connect(websocket, room_id, user_id, username)
        
        # Main message loop
        while True:
            try:
                logger.debug("Waiting for message...")
                data = await websocket.receive_text()
                logger.debug(f"Received message: {data}")
                message = json.loads(data)
                
                # Handle ping/pong
                if message.get('message_type') == 'ping':
                    logger.debug("Received ping, sending pong")
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
                logger.info(f"Cleaning up connection for user {user_id}")
                # First disconnect from manager
                await websocket_manager.disconnect(user_id, room_id)
                
                # Only close if connection is still open
                if websocket.client_state == WebSocketState.CONNECTED:
                    logger.info("Closing WebSocket connection")
                    try:
                        await websocket.close()
                        logger.info("WebSocket connection closed successfully")
                    except RuntimeError as e:
                        if "Cannot call \"send\" once a close message has been sent" not in str(e):
                            logger.error(f"Error closing WebSocket: {str(e)}")
                            raise
                        logger.warning("WebSocket already closed")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.close()
                except RuntimeError as e:
                    if "Cannot call \"send\" once a close message has been sent" not in str(e):
                        logger.error(f"Error during final cleanup: {str(e)}")
                        raise

def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocketManager instance"""
    return websocket_manager

def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocketManager instance"""
    return websocket_manager