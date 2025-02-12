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
        pass

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

    async def disconnect(self, user: User, room_id: str):
        if user.is_connected():
            user.clear_websocket()
            user.update_status(ParticipantStatus.OFFLINE)
        
        room = await chatroom_manager.get_room(room_id)
        if room:
            room.remove_participant(user.user_id)
            # Force broadcast participant list after removal
            await self.send_participant_list(room_id)

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

    async def check_connections(self):
        """Periodically check connection health"""
        while True:
            await asyncio.sleep(60)  # Match xx-second inactivity timeout
            current_time = time.time()
            # Iterate over a list of room IDs to avoid modifying the dictionary during iteration.
            room_ids = list(chatroom_manager.rooms.keys())
            for room_id in room_ids:
                # Retrieve the room via get_room, which cleans up expired rooms.
                room = await chatroom_manager.get_room(room_id)
                if not room:
                    continue
                for participant in room.participants:
                    if participant.is_connected():
                        # Check for inactivity (e.g., via last_active timestamp)
                        if current_time - participant.last_active.timestamp() > 60:
                            await self.disconnect(participant, room.room_id)

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

    # async def send_participant_list(self, room_id: str):
    #     """Send participant list only when there's actual changes"""
    #     room = await chatroom_manager.get_room(room_id)
    #     if not room:
    #         return
        
    #     current_state = hash(tuple((p.user_id, p.status) for p in room.participants))
    #     if room.last_participant_state == current_state:
    #         return  # No changes since last update
        
    #     room.last_participant_state = current_state  # Store hash of participant state
    #     participants = [{"user_id": p.user_id, "username": p.username} for p in room.participants]
    #     await self.broadcast(room_id, {
    #         "message_type": "participant_list",
    #         "participants": participants
    #     })

    async def broadcast(self, room_id: str, message: dict):
        room = await chatroom_manager.get_room(room_id)
        if room:
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

        # Main message loop
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

                # Check for common control messages
                if message.get("message_type") == "ping":
                    await websocket.send_json({
                        "message_type": "pong",
                        "timestamp": datetime.now(UTC).isoformat()
                    })
                    continue
                elif message.get("message_type") == "get_participants":
                    await websocket_manager.send_participant_list(room_id)
                    continue
                elif message.get("message_type") == "delete_room":
                    # Process room deletion request
                    room_obj = await chatroom_manager.get_room(room_id)
                    if room_obj:
                        # Broadcast deletion notification to all participants
                        await websocket_manager.broadcast(room_id, {
                            "message_type": "room_deleted",
                            "by": user.user_id,
                            "username": user.username
                        })
                        # Now delete the room
                        deleted = chatroom_manager.delete_private_room(room_id)
                        if deleted:
                            await websocket.close()
                            break
                        else:
                            await websocket.send_json({
                                "message_type": "error",
                                "content": "Failed to delete room."
                            })
                    else:
                        await websocket.send_json({
                            "message_type": "error",
                            "content": "Room does not exist."
                        })
                    continue
                elif message.get("message_type") == "leave_room":
                    # Process leave room request by closing the websocket connection
                    await websocket.close()
                    break
                else:
                    try:
                        # Now validate and process messages that are not ping messages
                        validated = Message.model_validate(message)
                        
                        # Convert to proper outbound type
                        if validated.content_type == ContentType.image:
                            validated = ImageMessage(
                                **validated.model_dump(),
                                image_data=b'',  # Will be populated from upload
                            )
                        else:
                            validated = OutboundMessage(**validated.model_dump())
                        
                        if validated.message_type == "chat":
                            if validated.sender_id != user_id:
                                continue
                            # Add message to room
                            try:
                                chatroom_manager.add_message_to_room(room_id, validated)
                            except Exception as e:
                                logger.error(f"Failed to add message to room: {str(e)}")
                                continue
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

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user_id}")
    finally:
        if user:
            # Cleanup and notifications
            await websocket_manager.disconnect(user, room_id)
            await websocket_manager.broadcast(room_id, {
                "message_type": "participant_left",
                "user_id": user.user_id,
                "username": user.username
            })
            await websocket_manager.send_participant_list(room_id)

def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocketManager instance"""
    return websocket_manager

def get_chatroom_manager() -> ChatroomManager:
    """Dependency to get WebSocketManager instance"""
    return chatroom_manager
