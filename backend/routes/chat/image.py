from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from typing import Dict
import io
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for images
image_store: Dict[str, dict] = {}
MAX_IMAGE_SIZE = 3 * 1024 * 1024  # 3MB
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}

@router.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    message_id: str = Form(...),
    timestamp: str = Form(...)
):
    try:
        # Validate image
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=415, detail="Unsupported image type")
        
        # Read image data
        image_data = await image.read()
        if len(image_data) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=413, detail="Image too large")
        
        # Generate unique image ID
        image_id = str(hash(image_data))
        
        # Store in memory with expiration
        image_store[image_id] = {
            'data': image_data,
            'content_type': image.content_type,
            'expires_at': datetime.now() + timedelta(hours=1),
            'message_id': message_id,
            'timestamp': timestamp
        }
        
        return {"success": True, "image_id": image_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        return {"success": False, "reason": str(e)}

@router.get("/get-image/{image_id}")
async def get_image(image_id: str):
    try:
        # Check if image exists
        if image_id not in image_store:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = image_store[image_id]
        
        # Check if expired
        if datetime.now() > image_data['expires_at']:
            del image_store[image_id]
            raise HTTPException(status_code=410, detail="Image expired")
        
        # Return image as streaming response
        return StreamingResponse(
            io.BytesIO(image_data['data']),
            media_type=image_data['content_type']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve image")

def cleanup_expired_images():
    """Periodically clean up expired images"""
    now = datetime.now()
    expired_ids = [
        image_id for image_id, data in image_store.items()
        if data['expires_at'] < now
    ]
    for image_id in expired_ids:
        del image_store[image_id]
