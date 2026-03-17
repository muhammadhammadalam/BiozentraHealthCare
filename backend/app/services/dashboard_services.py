from sqlalchemy.orm import Session
from app.models.sale import Sale
from app.models.product import Product
from app.models.inventory import Inventory


def get_stats(db: Session):
    return {
        "total_revenue": sum(s.total_price for s in db.query(Sale).all()),
        "total_products": db.query(Product).count(),
        "total_inventory_units": sum(i.quantity for i in db.query(Inventory).all()),
        "total_sales_count": db.query(Sale).count(),
    }
