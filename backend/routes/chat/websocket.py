from fastapi import WebSocket, WebSocketDisconnect
import logging
from models.chat.message import Message
from fastapi import APIRouter, Depends
from services.chat.chatroom_manager import ChatroomManager, get_chatroom_manager

router = APIRouter()

logger = logging.getLogger(__name__)

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

@router.websocket("/room/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str,
    chatroom_manager: ChatroomManager = Depends(get_chatroom_manager)
):
    # Get token from query params
    token = websocket.query_params.get("token")
    
    if not token or not await chatroom_manager.validate_room_token(room_id, token):
        await websocket.close(code=4003, reason="Invalid token")
        return

    # Get user ID from query params or headers
    user_id = websocket.query_params.get("user_id")  # Or extract from headers
    
    if not user_id:
        await websocket.close(code=4001, reason="User ID required")
        return

    # Connect using WebSocketManager
    await websocket_manager.connect(websocket, room_id, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message: {data}")
            
            # Handle the message using WebSocketManager
            # Example: Broadcast message to all participants
            message = Message.parse_raw(data)
            await websocket_manager.send_message(room_id, message)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket_manager.disconnect(user_id, room_id)
        await websocket.close()
        print(f"WebSocket connection closed for user: {user_id} in room: {room_id}") 