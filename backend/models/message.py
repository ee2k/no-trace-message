from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List, Optional
from fastapi import UploadFile

class CreateMessageRequest(BaseModel):
    message: str = Field(default="", max_length=2000)
    expiry: int = Field(..., gt=0, le=4320)  # Max 3 days in minutes
    burn_time: str = Field(...)  # Changed to str to handle 'never'
    token: str | None = Field(default=None, min_length=4, max_length=70)
    token_hint: str | None = Field(default=None, max_length=70)
    images: Optional[List[UploadFile]] = None

    @validator('burn_time')
    def validate_burn_time(cls, v):
        if v == 'never':
            return v
        try:
            burn_time = float(v)
            if burn_time < 0.1:
                raise ValueError('Burn time must be at least 0.1 seconds')
            return str(burn_time)
        except ValueError:
            raise ValueError('Invalid burn time format')

    class Config:
        arbitrary_types_allowed = True  # Required for UploadFile

class MessageResponse(BaseModel):
    id: str
    token: str
    token_hint: str | None
    burn_time: str  # Changed to str to match CreateMessageRequest
    expires_at: datetime
    is_custom_token: bool = Field(default=False)

    @validator('id')
    def validate_id(cls, v):
        if not v or len(v) != 10:
            raise ValueError('Invalid message ID format')
        return v

    @validator('burn_time')
    def validate_burn_time(cls, v):
        if v == 'never':
            return v
        try:
            burn_time = float(v)
            if burn_time < 0.1:
                raise ValueError('Burn time must be at least 0.1 seconds')
            return str(burn_time)
        except ValueError:
            raise ValueError('Invalid burn time format')

    @validator('expires_at')
    def validate_expiry(cls, v):
        if v < datetime.now():
            raise ValueError('Message has already expired')
        return v