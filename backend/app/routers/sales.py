from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/", response_model=SaleOut)
def record_sale(data: SaleCreate, db: Session = Depends(get_db)):
    sale = Sale(amount=data.amount)
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale

@router.get("/", response_model=list[SaleOut])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).all()
