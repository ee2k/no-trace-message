from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from models.message import CreateMessageRequest, MessageResponse
from services.message_store import MessageStore
import secrets
from datetime import datetime, timedelta
from utils.num_generator import generate_message_id, generate_access_token
from pydantic import ValidationError

router = APIRouter()
message_store = MessageStore()

@router.post("/create", response_model=MessageResponse)
async def create_message(
    message: str = Form(""),
    images: Optional[List[UploadFile]] = File(None),
    expiry: int = Form(...),
    burn_time: float = Form(...),
    token: Optional[str] = Form(None),
    token_hint: Optional[str] = Form(None)
):
    try:
        # Debug logging
        print(f"Received request data:")
        print(f"- message length: {len(message)}")
        print(f"- expiry: {expiry}")
        print(f"- burn_time: {burn_time}")
        print(f"- token: {'provided' if token else 'not provided'}")
        print(f"- token_hint: {'provided' if token_hint else 'not provided'}")
        if images:
            print(f"- images: {len(images)} files")
            for img in images:
                print(f"  - {img.filename}: {img.content_type}, size: {img.size}")

        # Validate request data
        try:
            create_request = CreateMessageRequest(
                message=message,
                expiry=expiry,
                burn_time=burn_time,
                token=token,
                token_hint=token_hint
            )
        except ValidationError as ve:
            print("Validation error details:", ve.errors())
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Validation error",
                    "errors": ve.errors()
                }
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

        # Fix: Only set is_custom_token to True if token was provided and not empty
        is_custom_token = bool(token and token.strip())
        # Create message object
        message_obj = {
            'id': message_id,
            'text': create_request.message,
            'images': image_data,
            'created_at': datetime.now(),
            'expires_at': expires_at,
            'burn_time': create_request.burn_time,
            'access_token': access_token,
            'token_hint': create_request.token_hint,
            'is_read': False,
            'is_custom_token': is_custom_token
        }

        # Store message
        await message_store.store_message(message_obj)

        return MessageResponse(
            id=message_id,
            token=access_token,
            token_hint=token_hint.strip() if token_hint else None,
            burn_time=burn_time,
            expires_at=expires_at,
            is_custom_token=is_custom_token
        )

    except ValidationError as ve:
        print("Validation error:", ve.errors())
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Validation error",
                "errors": ve.errors()
            }
        )
    except Exception as e:
        print("Unexpected error:", str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Server error",
                "error": str(e)
            }
        )

# @router.get("/{message_id}/meta", response_model=MessageResponse)
# async def get_message_meta(
#     message_id: str,
#     token: str = Form(...)  # Require token in POST body
# ):
#     try:
#         # Validate message ID and token
#         if not message_id or len(message_id) != 10:
#             raise HTTPException(status_code=400, detail="Invalid message ID")
            
#         message = await message_store.get_message(message_id, token)
#         if not message:
#             raise HTTPException(status_code=404, detail="Message not found or invalid token")

#         return MessageResponse(
#             id=message_id,
#             token=token,  # Safe to return as user already knows it
#             token_hint=message.get('token_hint'),
#             burn_time=message['burn_time'],
#             expires_at=message['expires_at'],
#             is_custom_token=message.get('is_custom_token', False)
#         )

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Unexpected error in get_message_meta: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{message_id}/meta", response_model=MessageResponse)
async def get_message_meta(message_id: str, token: str = Form(...)):
    try:
        # Validate message ID format
        if not message_id or len(message_id) != 10:
            raise HTTPException(
                status_code=400, 
                detail="Invalid message ID format"
            )

        # Get message from store
        message = await message_store.get_message(message_id, token)
        if not message:
            raise HTTPException(
                status_code=404, 
                detail="Message not found or invalid token"
            )

        return MessageResponse(
            id=message_id,
            token=token,  # Safe to return as user already knows it
            token_hint=message.get('token_hint'),
            burn_time=message['burn_time'],
            expires_at=message['expires_at'],
            is_custom_token=message.get('is_custom_token', False)
        )

    except Exception as e:
        print(f"Error getting message metadata: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to get message metadata"}
        )