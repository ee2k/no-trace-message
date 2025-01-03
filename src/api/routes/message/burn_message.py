from fastapi import APIRouter, UploadFile, Form, HTTPException
from typing import List, Optional
import secrets
import time
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/api/create")
async def create_message(
    message: str = Form(""),
    images: Optional[List[UploadFile]] = None,
    expiry: int = Form(...),  # in minutes
    burnTime: float = Form(...)  # in seconds
):
    try:
        # Generate unique message ID and access token
        message_id = secrets.token_urlsafe(16)
        access_token = secrets.token_urlsafe(32)
        
        # Calculate expiry timestamp
        expires_at = datetime.now() + timedelta(minutes=expiry)
        
        # Process and store images if any
        image_data = []
        if images:
            for img in images:
                content = await img.read()
                image_data.append({
                    'id': secrets.token_urlsafe(8),
                    'content': content,
                    'type': img.content_type
                })
        
        # Create message object
        message_obj = {
            'id': message_id,
            'text': message,
            'images': image_data,
            'created_at': datetime.now(),
            'expires_at': expires_at,
            'burn_time': burnTime,
            'access_token': access_token,
            'is_read': False
        }
        
        # Store in RAM (we'll need a message store service)
        await store_message(message_obj)
        
        return {
            'id': message_id,
            'token': access_token,
            'expires_at': expires_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))