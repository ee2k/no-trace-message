from fastapi import WebSocket, WebSocketDisconnect
import logging
from models.chat.message import Message, ImageMessage, OutboundMessage, ContentType
from fastapi import APIRouter
from services.chat.chatroom_manager import ChatroomManager
from utils.singleton import singleton
import json
import uuid
import time
import asyncio
from utils.chat_error_codes import ChatErrorCodes
from models.chat.user import User, ParticipantStatus
from pydantic import ValidationError
from models.chat.chatroom import PrivateRoom
from datetime import datetime, UTC

router = APIRouter()

logger = logging.getLogger(__name__)

chatroom_manager = ChatroomManager()

@singleton
class WebSocketManager:
    def __init__(self):
        # Removed local rooms variable; using chatroom_manager.rooms instead.
        # self.rooms: dict[str, PrivateRoom] = {}  # room_id -> PrivateRoom
        self.room_check_tasks: dict[str, asyncio.Task] = {}  # room_id -> check task

    async def connect(self, websocket: WebSocket, room_id: str, user: User):
        # Set user's WebSocket connection and mark active FIRST
        user.set_websocket(websocket)
        user.update_status(ParticipantStatus.ACTIVE)

        room = await chatroom_manager.get_room(room_id)
        
        # Use lock to prevent race conditions
        async with room.lock:  # Ensure PrivateRoom has an asyncio.Lock() attribute
            # Check if this user is already present in the room
            existing = next((p for p in room.participants if p.user_id == user.user_id), None)
            if existing:
                # Update the existing participant's connection
                existing.set_websocket(websocket)
                existing.update_status(ParticipantStatus.ACTIVE)
                await self.send_participant_list(room_id)
            else:
                # Add the new participant for first-time join
                room.add_participant(user)
                # Immediately broadcast updated participant list
                await self.send_participant_list(room_id)

    async def disconnect(self, user: User, room_id: str, close_code: int = 1000):
        logger.debug(f"=== disconnect {user.username}")
        if not user.is_disconnected():
            logger.debug(f'=== clear_websocket for {user.username}')
            user.clear_websocket(close_code)
            user.update_status(ParticipantStatus.OFFLINE)

        room = await chatroom_manager.get_room(room_id)
        if room:
            # Remove first, then broadcast
            if room.remove_participant(user.user_id):
                logger.debug(f'=== remove_participant for {user.username} successful')
                await self.broadcast(room_id, {
                    "message_type": "participant_left",
                    "user_id": user.user_id,
                    "username": user.username
                })
                logger.debug(f'=== after broadcast for {user.username} removal')
                await self.send_participant_list(room_id)
                logger.debug(f'=== after send_participant_list for {user.username} removal')

    async def send_participant_list(self, room_id: str):
        """Send participant list regardless of changes"""
        room = await chatroom_manager.get_room(room_id)
        if not room:
            return
        
        # Remove the state comparison to ensure updates are always sent
        participants = [{"user_id": p.user_id, "username": p.username} for p in room.participants]
        await self.broadcast(room_id, {
            "message_type": "participant_list",
            "participants": participants
        })

    async def send_message(self, room_id: str, message: Message):
        room = await chatroom_manager.get_room(room_id)
        if not room:
            return

        # Get fresh participant list every time
        current_participants = {p.user_id for p in room.participants}
        message.required_recipients = current_participants - {message.sender_id}

        # Store message in room history
        try:
            await chatroom_manager.add_message_to_room(room_id, message)
        except Exception as e:
            logger.error(f"Failed to add message to room: {str(e)}")
            return

        # Delivery logic
        first_attempt_failed = False
        delivered_count = 0
        total_recipients = len(message.required_recipients)
        
        # First delivery attempt - only target required recipients
        for participant in room.participants:
            if (participant.is_connected() 
                and participant.user_id in message.required_recipients):
                try:
                    await participant.websocket.send_text(message.model_dump_json())
                    message.mark_delivered(participant.user_id)
                    delivered_count += 1
                except Exception as e:
                    first_attempt_failed = True

        # Ack handling based on required recipients
        sender = next((p for p in room.participants if p.user_id == message.sender_id), None)
        if sender and sender.is_connected():
            if message.content_type == ContentType.text and delivered_count == total_recipients:
                await self.send_full_ack(sender, message)
            elif isinstance(message, ImageMessage) and message.loaded_recipients.issuperset(message.required_recipients):
                await self.send_full_ack(sender, message)
            else:
                if first_attempt_failed:
                    await self.send_partial_ack(sender, message)
                asyncio.create_task(
                    self.retry_failed_deliveries(room, message, max_retries=3)
                )

        # In all cases, start monitoring the message for expiry/deletion criteria
        asyncio.create_task(self.monitor_message_cleanup(room, message))

    async def retry_failed_deliveries(self, room: PrivateRoom, message: Message, max_retries: int):
        retry_count = 0
        
        while retry_count < max_retries:
            retry_count += 1
            await asyncio.sleep(2 ** retry_count)  # Exponential backoff
            
            # Get undelivered recipients who are still in the room
            undelivered = [
                p for p in room.participants 
                if p.user_id in message.required_recipients
                and p.user_id not in message.delivered_to
                and p.is_connected()
                and p.websocket is not None  # Additional check
            ]
            
            # Retry delivery
            for participant in undelivered:
                try:
                    await participant.websocket.send_text(message.model_dump_json())
                    message.mark_delivered(participant.user_id)
                except Exception as e:
                    logger.error(f"Retry failed for {participant.user_id}: {str(e)}")

            # Check if fully delivered
            if message.content_type == ContentType.text and message.required_recipients.issubset(message.delivered_to):
                sender = next((p for p in room.participants if p.user_id == message.sender_id), None)
                if sender and sender.is_connected():
                    await self.send_full_ack(sender, message)
                    await self.cleanup_message(room, message)
                return
                
        # Max retries reached - delete message
        await self.cleanup_message(room, message)

    async def send_full_ack(self, sender: User, message: Message):
        await sender.websocket.send_json({
            "message_type": "ack",
            "message_id": message.message_id,
            "status": "delivered"
        })

    async def send_partial_ack(self, sender: User, message: Message):
        await sender.websocket.send_json({
            "message_type": "ack",
            "message_id": message.message_id,
            "status": "partial"
        })

    async def cleanup_message(self, room: PrivateRoom, message: Message):
        if message in room.messages:
            room.messages.remove(message)

    def should_cleanup(self, message: OutboundMessage) -> bool:
        now = datetime.now(UTC)
        if now > message.expires_at:
            return True
        if message.content_type == ContentType.text:
            if message.required_recipients.issubset(message.delivered_to):
                return True
        elif message.content_type == ContentType.image:
            if isinstance(message, ImageMessage):
                if message.required_recipients.issubset(message.loaded_recipients):
                    return True
            else:
                if message.required_recipients.issubset(message.delivered_to):
                    return True
        return False

    async def monitor_message_cleanup(self, room: PrivateRoom, message: OutboundMessage):
        while True:
            if self.should_cleanup(message):
                # Send acknowledgment before cleanup for image messages
                if (isinstance(message, ImageMessage) and 
                    message.required_recipients.issubset(message.loaded_recipients)):
                    sender = next((p for p in room.participants if p.user_id == message.sender_id), None)
                    if sender and sender.is_connected():
                        await self.send_full_ack(sender, message)
                await self.cleanup_message(room, message)
                return
            await asyncio.sleep(5)

    async def start_room_checks(self, room_id: str):
        """Start connection checks for a specific room"""
        if room_id not in self.room_check_tasks or self.room_check_tasks[room_id].done():
            self.room_check_tasks[room_id] = asyncio.create_task(
                self._check_room_connections(room_id)
            )

    async def stop_room_checks(self, room_id: str):
        """Stop connection checks for a room"""
        if task := self.room_check_tasks.get(room_id):
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            del self.room_check_tasks[room_id]

    async def _check_room_connections(self, room_id: str):
        """Room-specific connection checking"""
        while True:
            await asyncio.sleep(60)
            room = await chatroom_manager.get_room(room_id)
            if not room or not room.participants:
                await self.stop_room_checks(room_id)
                return

            current_time = time.time()
            for participant in room.participants:
                if participant.is_connected():
                    try:
                        await participant.websocket.send_json({
                            "message_type": "ping",
                            "timestamp": current_time
                        })
                    except Exception:
                        await self.disconnect(participant, room_id)
                        continue
                    
                    if current_time - participant.last_active.timestamp() > 20:
                        await self.disconnect(participant, room_id, 4001)

    async def broadcast_failed_join(self, room_id: str, username: str):
        """Broadcast failed join attempt to room participants"""
        system_message = {
            "message_type": "system",
            "username": username,
            "code": ChatErrorCodes.FAILED_JOIN_ATTEMPT,
            "timestamp": time.time()
        }
        
        # Send to all participants in the room
        if room_id in chatroom_manager.rooms:
            room = chatroom_manager.rooms[room_id]
            for participant in room.participants:
                if participant.is_connected():
                    await participant.websocket.send_json(system_message)

    async def broadcast(self, room_id: str, message: dict):
        room = await chatroom_manager.get_room(room_id)
        if room:
            for participant in room.participants:
                if participant.is_connected():
                    try:
                        await participant.websocket.send_json(message)
                    except Exception as e:
                        logger.error(f"Failed to broadcast to {participant.user_id}: {str(e)}")
                        # Disconnect the participant if we can't send to them
                        await self.disconnect(participant, room_id)


websocket_manager = WebSocketManager()

async def handle_websocket_messages(websocket: WebSocket, room_id: str, user: User):
    """Handle incoming WebSocket messages in a dedicated loop"""
    while True:
        try:
            data = await websocket.receive_text()
            user.last_active = datetime.now(UTC)
            message = json.loads(data)

            if not message:
                await websocket.send_json({
                    "message_type": "error",
                    "content": "Empty message received"
                })
                continue

            match message.get("message_type"):
                case "auth":
                    await websocket.send_json({
                        "message_type": "auth_ack",
                        "status": "ok"
                    })
                case "ping":
                    await websocket.send_json({
                        "message_type": "pong",
                        "timestamp": datetime.now(UTC).isoformat()
                    })
                case "pong":
                    user.last_active = datetime.now(UTC)
                case "get_participants":
                    await websocket_manager.send_participant_list(room_id)
                case "delete_room":
                    room_obj = await chatroom_manager.get_room(room_id)
                    if room_obj:
                        await websocket_manager.broadcast(room_id, {
                            "message_type": "room_deleted",
                            "by": user.user_id,
                            "username": user.username
                        })
                        if chatroom_manager.delete_private_room(room_id):
                            await websocket.close()
                            return
                        else:
                            await websocket.send_json({
                                "message_type": "error",
                                "content": "Failed to delete room."
                            })
                case "leave_room":
                    await websocket.close()
                    return
                case "clear_messages":
                    room = await chatroom_manager.get_room(room_id)
                    if room:
                        room.messages.clear()
                        await websocket_manager.broadcast(room_id, {
                            "message_type": "clear_messages",
                            "username": user.username,
                            "timestamp": time.time()
                        })
                case _:
                    try:
                        validated = Message.model_validate(message)
                        if validated.content_type == ContentType.image:
                            validated = ImageMessage(
                                **validated.model_dump(),
                                image_data=b''
                            )
                        else:
                            validated = OutboundMessage(**validated.model_dump())
                        
                        if validated.message_type == "chat":
                            if validated.sender_id != user.user_id:
                                continue
                            try:
                                chatroom_manager.add_message_to_room(room_id, validated)
                            except Exception as e:
                                logger.error(f"Failed to add message to room: {str(e)}")
                            await websocket_manager.send_message(room_id, validated)
                        elif validated.message_type == "system":
                            await websocket_manager.broadcast_system_message(
                                room_id, validated.content
                            )
                    except ValidationError as e:
                        logger.error(f"Invalid message: {str(e)}")

        except json.JSONDecodeError:
            logger.error("Invalid JSON message")
            await websocket.send_json({
                "message_type": "error",
                "content": "Invalid JSON format"
            })
        except ValidationError as e:
            logger.error(f"Invalid message format: {str(e)}")
            await websocket.send_json({
                "message_type": "error",
                "content": f"Validation error: {str(e)}"
            })

@router.websocket("/chatroom/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    user = None
    try:
        await websocket.accept()
        
        # Get all params from query string
        username = websocket.query_params.get("username")
        room_token = websocket.query_params.get("room_token")
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

        # room_token validation for private rooms
        if room.requires_token():
            if not room_token or not await chatroom_manager.validate_room_token(room_id, room_token):
                await websocket.close(code=4003, reason="Invalid room_token")
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
            "message_type": "connection_info",
            "user_id": user_id,
            "participants": [
                {"user_id": p.user_id, "username": p.username}
                for p in room.participants
            ]
        })
        
        # Broadcast join notification
        await websocket_manager.broadcast(room_id, {
            "message_type": "participant_joined",
            "user_id": user.user_id,
            "username": user.username
        })

        # Start room checks when first participant joins
        if len(room.participants) == 1:  # After adding the new user
            await websocket_manager.start_room_checks(room_id)

        await handle_websocket_messages(websocket, room_id, user)

    except WebSocketDisconnect:
        logger.debug(f"WebSocket disconnected: {user.user_id if user else 'unknown'}")
    finally:
        if user:
            await websocket_manager.disconnect(user, room_id)
            # Stop checks if last participant
            room = await chatroom_manager.get_room(room_id)
            if room and not room.participants:
                await websocket_manager.stop_room_checks(room_id)

def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocketManager instance"""
    return websocket_manager

def get_chatroom_manager() -> ChatroomManager:
    """Dependency to get WebSocketManager instance"""
    return chatroom_manager
