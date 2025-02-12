from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import datetime
import re
from typing import AsyncGenerator
import json

class ImageData(BaseModel):
    content: str
    type: str

class BurningMessage(BaseModel):
    id: str
    text: str | None = None
    images: list[ImageData] | None = None
    burn_index: int
    expires_at: datetime
    expiry_index: int
    token: str | None = Field(default=None)
    token_hint: str | None = Field(default=None, max_length=70)
    created_at: datetime = Field(default_factory=datetime.now)
    font_size: int | None = None

    @validator('id')
    def validate_id(cls, v):
        # Simple validation for browser requests
        # if not re.match(r'^[\w-]{8,32}$', v):
        if len(v) < 1 or len(v) > 70:
            raise ValueError('Invalid message ID format')
        return v

    @validator('burn_index')
    def validate_burn_index(cls, v):
        if not (0 <= v <= 6):
            raise ValueError('Burn index must be between 0 and 6')
        return v

    @validator('token')
    def validate_token(cls, v):
        if v is not None and v != "":  # Only validate non-empty tokens
            if len(v) < 1 or len(v) > 70:
                raise ValueError('Token must be between 1 and 70 characters')
        return v

    @validator('font_size')
    def validate_font_size(cls, v):
        if v is not None and v != "":  # Only validate non-empty tokens
            if v < 0 or v > 4:
                raise ValueError('Font size incorrect')
        return v

    def to_response(self) -> dict:
        """Convert message to API response format"""
        return {
            "id": self.id,
            "token": self.token,
            "token_hint": self.token_hint,
            "burn_index": self.burn_index,
            "expiry_index": self.expiry_index,
            "expires_at": self.expires_at
        }

    def to_content(self) -> dict:
        """Get message content for delivery"""
        return {
            "text": self.text,
            "images": self.images,
            "burn_index": self.burn_index,
            "font_size": self.font_size
        }

    def is_expired(self) -> bool:
        """Check if message is expired"""
        return datetime.now() >= self.expires_at

    def should_burn(self) -> bool:
        """Check if message should be burned"""
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
            "burn_index": self.burn_index,
            "font_size": self.font_size
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

    def to_dict(self) -> dict:
        """Convert message to dictionary for response"""
        return {
            "text": self.text,
            "images": self.images,
            "burn_index": self.burn_index,
            "expiry_index": self.expiry_index,
            "font_size": self.font_size
        }
