# app/schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional


class UserCreateSchema(BaseModel):
    username: str = Field(..., min_length=3)
    full_name: str
    password: str = Field(..., min_length=6)
    role: Optional[str] = "staff"

    # Simplified Recovery: Exactly 4 digits
    recovery_pin: str = Field(..., min_length=4,
                              max_length=4, pattern=r"^\d{4}$")


class UserReadSchema(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    role: str

    model_config = {"from_attributes": True}


class TokenSchema(BaseModel):
    access_token: str
    token_type: str
