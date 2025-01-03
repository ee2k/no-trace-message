from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from api.models.message import CreateMessageRequest, MessageResponse
from api.services.message_store import MessageStore
import secrets
from datetime import datetime, timedelta
from api.utils.num_generator import generate_message_id, generate_access_token

router = APIRouter()
message_store = MessageStore()

@router.post("/create", response_model=MessageResponse)
async def create_message(
    message: str = Form(""),
    images: Optional[List[UploadFile]] = File(None),
    expiry: int = Form(...),
    burn_time: float = Form(...),
    token: Optional[str] = Form(None)
):
    try:
        # Validate request data
        create_request = CreateMessageRequest(
            message=message,
            expiry=expiry,
            burn_time=burn_time,
            token=token
        )

        # Validate images
        if images:
            if len(images) > 1:
                raise HTTPException(
                    status_code=400, 
                    detail="Maximum 1 image allowed"
                )
            
            for img in images:
                if not img.content_type.startswith('image/'):
                    raise HTTPException(
                        status_code=400,
                        detail=f"File type {img.content_type} not allowed"
                    )
                
                content = await img.read()
                if len(content) > 3 * 1024 * 1024:  # 3MB
                    raise HTTPException(
                        status_code=400,
                        detail="Image size exceeds 3MB limit"
                    )
                await img.seek(0)  # Reset file pointer

        # Generate message ID with collision checking
        message_id = generate_message_id(
            exists_check=lambda id: id in message_store.messages
        )
        
        # Use custom token or generate one
        access_token = token.strip() if token else generate_access_token()
        expires_at = datetime.now() + timedelta(minutes=expiry)

        # Process images
        image_data = []
        if images:
            for img in images:
                content = await img.read()
                image_data.append({
                    'id': secrets.token_urlsafe(8),
                    'content': content,
                    'type': img.content_type
                })

        is_custom_token = bool(token)
        # Create message object
        message_obj = {
            'id': message_id,
            'text': message,
            'images': image_data,
            'created_at': datetime.now(),
            'expires_at': expires_at,
            'burn_time': burn_time,
            'access_token': access_token,
            'is_read': False,
            'is_custom_token': is_custom_token
        }

        # Store message
        await message_store.store_message(message_obj)

        return MessageResponse(
            id=message_id,
            token=access_token,
            burn_time=burn_time,
            expires_at=expires_at,
            is_custom_token=is_custom_token
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))