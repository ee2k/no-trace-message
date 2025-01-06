from pydantic import BaseModel, Field, validator
from datetime import datetime
import re
from typing import AsyncGenerator
import json

class ImageData(BaseModel):
    content: str
    type: str

class Message(BaseModel):
    id: str
    text: str | None = None
    images: list[ImageData] | None = None
    burn_time: str | float
    expires_at: datetime
    token: str | None = Field(default=None)
    token_hint: str | None = Field(default=None, max_length=70)
    # is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

    @validator('burn_time')
    def validate_burn_time(cls, v):
        if v == 'never':
            return v
        try:
            burn_time = float(v)
            if burn_time < 0.1:
                raise ValueError('Burn time must be at least 0.1 second')
            return str(burn_time)
        except ValueError:
            raise ValueError('Invalid burn time format')

    @validator('id')
    def validate_id(cls, v):
        # Simple validation for browser requests
        if not re.match(r'^[\w-]{8,32}$', v):
            raise ValueError('Invalid message ID format')
        return v

    @validator('token')
    def validate_token(cls, v):
        if v is not None and v != "":  # Only validate non-empty tokens
            if len(v) < 6 or len(v) > 70:
                raise ValueError('Token must be between 6 and 70 characters')
        return v

    def to_response(self) -> dict:
        """Convert message to API response format"""
        return {
            "id": self.id,
            "token": self.token,
            "token_hint": self.token_hint,
            "burn_time": self.burn_time,
            "expires_at": self.expires_at
        }

    def to_content(self) -> dict:
        """Get message content for delivery"""
        return {
            "text": self.text,
            "images": self.images,
            "burn_time": self.burn_time
        }

    # def mark_as_read(self) -> None:
    #     self.is_read = True

    def is_expired(self) -> bool:
        """Check if message is expired"""
        return datetime.now() >= self.expires_at

    def should_burn(self) -> bool:
        """Check if message should be burned"""
        # return self.is_read or self.is_expired()
        return self.is_expired()

    async def stream_content(self) -> AsyncGenerator[bytes, None]:
        """Stream message content in JSON format"""
        content = {
            "text": self.text,
            "images": [
                {
                    "type": img.type,
                    "content": img.content
                } for img in (self.images or [])
            ],
            "burn_time": self.burn_time
        }
        yield json.dumps(content).encode('utf-8')

    def check_expiry(self) -> bool:
        """Check if message is expired and should be deleted immediately"""
        return self.is_expired()

    def check_token(self, token: str) -> bool:
        """Check if provided token matches message token"""
        if not self.token:
            return True
        return self.token == token

# class CreateMessageRequest(BaseModel):
#     message: str = Field(default="", max_length=2000)
#     expiry: int = Field(..., gt=0, le=4320)  # Max 3 days in minutes
#     burn_time: str = Field(...)  # Changed to str to handle 'never'
#     token: str | None = Field(default=None, min_length=6, max_length=70)  # Make token optional
#     token_hint: str | None = Field(default=None, max_length=70)
#     images: Optional[List[UploadFile]] = None

#     @validator('burn_time')
#     def validate_burn_time(cls, v):
#         if v == 'never':
#             return v
#         try:
#             burn_time = float(v)
#             if burn_time < 0.1:
#                 raise ValueError('Burn time must be at least 0.1 second')
#             return str(burn_time)
#         except ValueError:
#             raise ValueError('Invalid burn time format')

#     class Config:
#         arbitrary_types_allowed = True  # Required for UploadFile

# class MessageResponse(BaseModel):
#     id: str
#     token: str
#     token_hint: str | None
#     burn_time: str  # Changed to str to match CreateMessageRequest
#     expires_at: datetime

#     @validator('id')
#     def validate_id(cls, v):
#         if not v or len(v) != 10:
#             raise ValueError('Invalid message ID format')
#         return v

#     @validator('burn_time')
#     def validate_burn_time(cls, v):
#         if v == 'never':
#             return v
#         try:
#             burn_time = float(v)
#             if burn_time < 0.1:
#                 raise ValueError('Burn time must be at least 0.1 seconds')
#             return str(burn_time)
#         except ValueError:
#             raise ValueError('Invalid burn time format')