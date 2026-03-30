from pydantic import BaseModel

class DashboardStats(BaseModel):
    total_sales: float
    total_products: int
    total_inventory: int
