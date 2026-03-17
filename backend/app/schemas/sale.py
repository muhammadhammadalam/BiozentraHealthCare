from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SaleCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class SaleResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
