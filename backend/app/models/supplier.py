from sqlalchemy import Column, Integer, String
from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True, default="")
    email = Column(String, nullable=True, default="")
    phone = Column(String, nullable=True, default="")
    products = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="Active")
    last_order = Column(String, nullable=True, default="")
