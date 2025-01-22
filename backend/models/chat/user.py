from pydantic import BaseModel, validator, Field
from typing import Optional
import uuid

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    connection_id: Optional[str] = None

    @validator('username')
    def validate_username(cls, value):
        if not value or len(value.strip()) < 1:
            raise ValueError('Username cannot be empty')
        if len(value) > 35:
            raise ValueError('Username cannot be longer than 35 characters')
        return value.strip() 