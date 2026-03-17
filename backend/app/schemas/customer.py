from pydantic import BaseModel
from typing import Optional


class CustomerCreate(BaseModel):
    name: str
    contact: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    orders: int = 0
    total_spent: float = 0.0


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    orders: Optional[int] = None
    total_spent: Optional[float] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    contact: str
    email: str
    phone: str
    location: str
    orders: int
    total_spent: float

    class Config:
        from_attributes = True
