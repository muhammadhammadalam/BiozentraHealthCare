from pydantic import BaseModel
from typing import Optional


class SupplierCreate(BaseModel):
    name: str
    contact: str = ""
    email: str = ""
    phone: str = ""
    products: int = 0
    status: str = "Active"
    last_order: str = ""


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    products: Optional[int] = None
    status: Optional[str] = None
    last_order: Optional[str] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    contact: str
    email: str
    phone: str
    products: int
    status: str
    last_order: str

    class Config:
        from_attributes = True
