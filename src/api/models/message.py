from pydantic import BaseModel, Field
from datetime import datetime

class CreateMessageRequest(BaseModel):
    message: str = Field(default="", max_length=2000)
    expiry: int = Field(..., gt=0, le=4320)  # Max 3 days in minutes
    burn_time: float = Field(..., ge=0.1)  # In seconds

class MessageResponse(BaseModel):
    id: str
    token: str
    expires_at: datetime