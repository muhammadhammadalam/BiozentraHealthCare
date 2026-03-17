from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: Optional[str] = None


class TokenResponse(BaseModel):
    access: str
    refresh: str
    token_type: str = "bearer"
