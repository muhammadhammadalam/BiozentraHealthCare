from pydantic import BaseModel
from typing import Optional


class OrderCreate(BaseModel):
    id: Optional[str] = None
    customer: str
    products: str
    total: float
    status: str = "Pending"
    date: str


class OrderUpdate(BaseModel):
    customer: Optional[str] = None
    products: Optional[str] = None
    total: Optional[float] = None
    status: Optional[str] = None
    date: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    customer: str
    products: str
    total: float
    status: str
    date: str

    class Config:
        from_attributes = True
