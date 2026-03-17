from pydantic import BaseModel
from typing import Optional


class InvoiceCreate(BaseModel):
    id: Optional[str] = None
    customer: str
    amount: float
    status: str = "Pending"
    date: str
    due_date: str


class InvoiceUpdate(BaseModel):
    customer: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: str
    customer: str
    amount: float
    status: str
    date: str
    due_date: str

    class Config:
        from_attributes = True
