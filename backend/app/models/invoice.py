from sqlalchemy import Column, Float, String
from app.core.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, index=True)   # e.g. INV-2026-001
    customer = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="Pending")
    date = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
