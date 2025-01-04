from pydantic import BaseModel, Field
from datetime import datetime

class CreateMessageRequest(BaseModel):
    message: str = Field(default="", max_length=2000)
    expiry: int = Field(..., gt=0, le=4320)  # Max 3 days in minutes
    burn_time: float = Field(..., ge=0.1)  # In seconds
    token: str | None = Field(default=None, min_length=4, max_length=70)  # Optional custom token

class MessageResponse(BaseModel):
    id: str
    token: str
    burn_time: float
    expires_at: datetime
    is_custom_token: bool = Field(default=False)