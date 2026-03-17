from sqlalchemy import Column, Integer, Float, String
from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True, default="")
    email = Column(String, nullable=True, default="")
    phone = Column(String, nullable=True, default="")
    location = Column(String, nullable=True, default="")
    orders = Column(Integer, nullable=False, default=0)
    total_spent = Column(Float, nullable=False, default=0.0)
