from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sale import Sale
from sqlalchemy import func

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    total_sales = db.query(func.sum(Sale.amount)).scalar() or 0
    return {
        "total_sales": total_sales,
        "currency": "PKR"
    }
