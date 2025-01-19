from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import List, Optional
from models.message import Message
from services.message_store import MessageStore
from datetime import datetime, timedelta
from utils.num_generator import generate_id
import base64
import traceback
from pydantic import BaseModel
import logging
from fastapi.responses import StreamingResponse
from utils.msg_error_codes import ErrorCodes, STATUS_CODES
from utils.constants import CODE

logger = logging.getLogger(__name__)

router = APIRouter()
message_store = MessageStore()

class TokenRequest(BaseModel):
    token: str = ''

# Define time mappings (in minutes)
EXPIRY_TIMES = [
    1,      # 1 min
    10,     # 10 min
    60,     # 1 hour
    720,    # 12 hours
    1440,   # 1 day
    4320,   # 3 days
    10080   # 1 week
]

# Define burn times (in seconds)
BURN_TIMES = [
    0.1,    # 0.1 second
    1,      # 1 second
    3,      # 3 seconds
    7,      # 7 seconds
    180,    # 3 minutes
    600,    # 10 minutes
    "never" # till closed
]

FONT_SIZES = [
    0,
    1,
    2,
    3,
    4
]

@router.post("/create", response_model=dict)
async def create_message(
    message: str = Form(""),
    images: List[UploadFile] = File(default=[]),
    expiry_index: int = Form(...),
    burn_index: int = Form(...),
    token: Optional[str] = Form(None),
    token_hint: Optional[str] = Form(None),
    font_size: Optional[int] = Form(None)
):
    try:
        # Validate indices
        if not (0 <= expiry_index < len(EXPIRY_TIMES)):
            raise HTTPException(
                status_code=STATUS_CODES[ErrorCodes.INVALID_EXPIRY],
                detail={CODE: ErrorCodes.INVALID_EXPIRY.value}
            )
        if not (0 <= burn_index < len(BURN_TIMES)):
            raise HTTPException(
                status_code=STATUS_CODES[ErrorCodes.INVALID_BURN],
                detail={CODE: ErrorCodes.INVALID_BURN.value}
            )
        if font_size is not None and not (0 <= font_size < 5):
            raise HTTPException(
                status_code=STATUS_CODES[ErrorCodes.INVALID_FONT],
                detail={CODE: ErrorCodes.INVALID_FONT.value}
            )

        # Validate images
        if images:
            if len(images) > 1:
                raise HTTPException(
                    status_code=STATUS_CODES[ErrorCodes.MAX_IMAGES_EXCEEDED],
                    detail={CODE: ErrorCodes.MAX_IMAGES_EXCEEDED.value}
                )
            
            for img in images:
                if not img.content_type.startswith('image/'):
                    raise HTTPException(
                        status_code=STATUS_CODES[ErrorCodes.INVALID_FILE_TYPE],
                        detail={CODE: ErrorCodes.INVALID_FILE_TYPE.value}
                    )
                
                content = await img.read()
                if len(content) > 3 * 1024 * 1024:  # 3MB
                    raise HTTPException(
                        status_code=STATUS_CODES[ErrorCodes.FILE_TOO_LARGE],
                        detail={CODE: ErrorCodes.FILE_TOO_LARGE.value}
                    )
                await img.seek(0)

        # Generate message ID with collision checking
        message_id = generate_id(
            length=16,
            exists_check=lambda id: id in message_store.messages
        )
        
        # Process images
        image_data = []
        if images:
            for img in images:
                content = await img.read()
                image_data.append({
                    'content': base64.b64encode(content).decode('utf-8'),
                    'type': img.content_type
                })

        expires_at = datetime.now() + timedelta(minutes=EXPIRY_TIMES[expiry_index])

        # Create message object using our Message model
        message_obj = Message(
            id=message_id,
            text=message,
            images=image_data,
            burn_index=burn_index,
            expires_at=expires_at,
            expiry_index=expiry_index,
            token=token.strip() if token else "",
            token_hint=token_hint.strip() if token_hint else None,
            font_size=font_size
        )

        # Store message
        await message_store.store_message(message_obj)

        # Return response
        return message_obj.to_response()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=STATUS_CODES[ErrorCodes.SERVER_ERROR],
            detail={CODE: ErrorCodes.SERVER_ERROR.value}
        )

@router.post("/{message_id}")
async def get_message(message_id: str, request: TokenRequest, client: Request):
    try:
        # Check if message exists
        message = await message_store.check_message(message_id)
        if not message:
            raise HTTPException(
                status_code=STATUS_CODES[ErrorCodes.MESSAGE_NOT_FOUND],
                detail={CODE: ErrorCodes.MESSAGE_NOT_FOUND.value}
            )
            
        # If message requires token
        if message.token:
            # Check rate limiting
            check_result = await message_store.check_token_attempts(message_id, client.client.host)
            if not check_result["allowed"]:
                raise HTTPException(
                    status_code=STATUS_CODES[ErrorCodes.TOO_MANY_ATTEMPTS],
                    detail={CODE: ErrorCodes.TOO_MANY_ATTEMPTS.value}
                )
            
            # If token provided, validate it
            if request.token:
                if not message.check_token(request.token):
                    await message_store.record_failed_attempt(message_id, client.client.host)
                    raise HTTPException(
                        status_code=STATUS_CODES[ErrorCodes.INVALID_TOKEN],
                        detail={CODE: ErrorCodes.INVALID_TOKEN.value}
                    )
                # Return full message content if token valid
                return StreamingResponse(
                    message_store.stream_and_delete_message(message_id),
                    media_type="application/json"
                )
            
            # Return metadata if token required but not provided
            return {
                "needs_token": True,
                "token_hint": message.token_hint
            }

        # No token required - return full content immediately
        content = message.to_dict()
        content["needs_token"] = False
        content["token_hint"] = None
        return StreamingResponse(
            message_store.stream_and_delete_message(message_id),
            media_type="application/json"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving message: {str(e)}")
        raise HTTPException(
            status_code=STATUS_CODES[ErrorCodes.SERVER_ERROR],
            detail={CODE: ErrorCodes.SERVER_ERROR.value}
        )

@router.post("/{message_id}/meta")
async def get_message_meta(message_id: str, request: TokenRequest):
    try:
        message = await message_store.get_message(message_id, request.token)
        if not message:
            raise HTTPException(status_code=400, detail={CODE: ErrorCodes.MESSAGE_NOT_FOUND.value})

        return {
            "burn_index": message.burn_index,
            "expiry_index": message.expiry_index,
            "token_hint": message.token_hint if message.token else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting message metadata: {str(e)}")
        raise HTTPException(status_code=500, detail={CODE: ErrorCodes.SERVER_ERROR.value})
