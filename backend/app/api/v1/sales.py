from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.schemas.sale import SaleCreate, SaleResponse

router = APIRouter()


@router.post("/", response_model=SaleResponse, status_code=201)
def record_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    try:
        product = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        if product.stock < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        product.stock -= payload.quantity
        sale = Sale(
            product_id=payload.product_id,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
            total_price=payload.quantity * payload.unit_price,
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)
        return sale
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Transaction failed")


@router.get("/", response_model=list[SaleResponse])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).all()
