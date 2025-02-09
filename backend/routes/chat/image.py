from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta, UTC
import io
import logging
from fastapi import Depends
from routes.chat.websocket import WebSocketManager, get_websocket_manager, get_chatroom_manager
from models.chat.message import ImageMessage
import asyncio
from utils.chat_error_codes import STATUS_CODES, ChatErrorCodes
from services.chat.chatroom_manager import ChatroomManager 
from utils.error import Coded_Error
from uuid import uuid4

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_IMAGE_SIZE = 3 * 1024 * 1024  # 3MB
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}

def generate_image_id() -> str:
    # Get current timestamp in milliseconds
    timestamp = int(datetime.now().timestamp() * 1000)
    # Generate UUID and remove hyphens
    uuid_part = str(uuid4()).replace('-', '')
    # Combine timestamp and UUID
    return f"{timestamp}_{uuid_part}"

@router.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    message_id: str = Form(...),
    timestamp: str = Form(...),
    sender_id: str = Form(...),
    room_id: str = Form(...),
    websocket_manager: WebSocketManager = Depends(get_websocket_manager),
    chatroom_manager: ChatroomManager = Depends(get_chatroom_manager)
):
    try:
        logger.info(
            "Received image upload request with fields: "
            f"message_id={message_id}, "
            f"timestamp={timestamp}, "
            f"sender_id={sender_id}, "
            f"room_id={room_id}"
        )
        
        # Validate image
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=STATUS_CODES.get(ChatErrorCodes.IMAGE_TYPE_NOT_SUPPORTED, 500),
                detail={"code": ChatErrorCodes.IMAGE_TYPE_NOT_SUPPORTED})
        
        # Read image data
        image_data = await image.read()
        
        # Generate unique image ID using timestamp + UUID
        image_id = generate_image_id()
        
        room = await chatroom_manager.get_room(room_id)
        
        # Get from WebSocket room participants
        required_recipients = {p.user_id for p in room.participants 
                              if p.user_id != sender_id}
        
        # Create message
        message = ImageMessage(
            message_id=message_id,
            message_type='chat',
            content_type='image',
            content=image_id,
            sender_id=sender_id,
            timestamp=timestamp,
            image_data=image_data,
            required_recipients=required_recipients,
            loaded_recipients=set(),
            expires_at=datetime.now() + timedelta(hours=1)
        )

        # Return success first
        response = {"success": True, "image_id": image_id}

        # Schedule the WebSocket message to be sent after returning the response
        asyncio.create_task(websocket_manager.send_message(room_id, message))

        return response
    
    except Coded_Error as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code", ChatErrorCodes.IMAGE_TOO_LARGE}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        return {"success": False, "reason": str(e)}

@router.get("/get-image/{image_id}")
async def get_image(
    image_id: str,
    room_id: str = Query(...),
    user_id: str = Query(...),
    chatroom_manager: ChatroomManager = Depends(get_chatroom_manager),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        room = await chatroom_manager.get_room(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # Find the image message
        image_message = next(
            (msg for msg in room.messages 
             if isinstance(msg, ImageMessage) and msg.content == image_id),
            None
        )
        
        if not image_message:
            raise HTTPException(status_code=404, detail="Image not found")

        # Check expiration
        if datetime.now(UTC) > image_message.expires_at:
            room.messages.remove(image_message)
            raise HTTPException(status_code=410, detail="Image expired")

        # Schedule the mark-loaded task after response is sent
        background_tasks.add_task(
            mark_image_loaded,
            room_id,
            image_id,
            user_id
        )

        # Return image as streaming response
        return StreamingResponse(
            io.BytesIO(image_message.image_data),
            media_type=image_message.content_type
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve image")

async def mark_image_loaded(room_id: str, image_id: str, user_id: str, chatroom_manager: ChatroomManager = Depends(get_chatroom_manager)):
    """Background task to mark image as loaded by user"""
    try:
        room = await chatroom_manager.get_room(room_id)
        if not room:
            return

        image_message = next(
            (msg for msg in room.messages 
             if isinstance(msg, ImageMessage) and msg.content == image_id),
            None
        )
        
        if image_message and user_id in image_message.required_recipients:
            image_message.mark_loaded(user_id)
            logger.debug(f"Marked image {image_id} as loaded by {user_id}")
            
            # Check if all required recipients have loaded
            if image_message.loaded_recipients.issuperset(image_message.required_recipients):
                logger.info(f"All recipients loaded image {image_id}, scheduling cleanup")
                room.messages.remove(image_message)
                
    except Exception as e:
        logger.error(f"Error marking image loaded: {str(e)}")

# def cleanup_expired_images():
#     """Periodically clean up expired images"""
#     now = datetime.now()
#     expired_ids = [
#         image_id for image_id, data in image_store.items()
#         if data['expires_at'] < now
#     ]
#     for image_id in expired_ids:
#         del image_store[image_id]
