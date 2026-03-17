from pydantic import BaseModel
from typing import Optional


class InventoryCreate(BaseModel):
    name: str
    product_id: Optional[int] = None
    batch: str = ""
    quantity: int
    max_stock: int = 0
    expiry: str = ""
    status: str = "Healthy"


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    batch: Optional[str] = None
    quantity: Optional[int] = None
    max_stock: Optional[int] = None
    expiry: Optional[str] = None
    status: Optional[str] = None


class InventoryResponse(BaseModel):
    id: int
    name: str
    product_id: Optional[int]
    batch: str
    quantity: int
    max_stock: int
    expiry: str
    status: str

    class Config:
        from_attributes = True
