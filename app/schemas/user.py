# app/schemas/user.py
from pydantic import BaseModel, EmailStr


class UserCreateSchema(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str
    role: str | None = "staff"


class UserReadSchema(BaseModel):
    id: int
    username: str
    full_name: str | None
    role: str

    model_config = {"from_attributes": True}


class TokenSchema(BaseModel):
    access_token: str
    token_type: str
