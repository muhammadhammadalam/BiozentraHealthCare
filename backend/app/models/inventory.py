from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, ForeignKey
from app.core.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, default="")
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=True)
    batch: Mapped[str] = mapped_column(String, nullable=True, default="")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expiry: Mapped[str] = mapped_column(String, nullable=True, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="Healthy")
