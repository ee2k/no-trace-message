from pydantic import BaseModel, Field, validator
from datetime import datetime

class CreateMessageRequest(BaseModel):
    message: str = Field(default="", max_length=2000)
    expiry: int = Field(..., gt=0, le=4320)  # Max 3 days in minutes
    burn_time: float = Field(..., ge=0.1)  # In seconds
    token: str | None = Field(default=None, min_length=4, max_length=70)
    token_hint: str | None = Field(default=None, max_length=70)  # New field

class MessageResponse(BaseModel):
    id: str
    token: str
    token_hint: str | None
    burn_time: float
    expires_at: datetime
    is_custom_token: bool = Field(default=False)

    @validator('id')
    def validate_id(cls, v):
        if not v or len(v) != 10:
            raise ValueError('Invalid message ID format')
        return v

    @validator('burn_time')
    def validate_burn_time(cls, v):
        if v < 0.1 or v > 600:  # Between 0.1s and 10min
            raise ValueError('Burn time must be between 0.1 and 600 seconds')
        return v

    @validator('expires_at')
    def validate_expiry(cls, v):
        if v < datetime.now():
            raise ValueError('Message has already expired')
        return v