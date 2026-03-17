from sqlalchemy import Column, Integer, Float, String
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)   # e.g. ORD-001
    customer = Column(String, nullable=False)
    products = Column(String, nullable=False)            # description string
    total = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="Pending")
    date = Column(String, nullable=False)
