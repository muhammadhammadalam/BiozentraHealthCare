import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter()


def _next_order_id(db: Session) -> str:
    orders = db.query(Order).all()
    if not orders:
        return "ORD-001"
    nums = []
    for o in orders:
        m = re.match(r"ORD-(\d+)", o.id)
        if m:
            nums.append(int(m.group(1)))
    return f"ORD-{str(max(nums) + 1).zfill(3)}"


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    order_id = payload.id or _next_order_id(db)
    if db.query(Order).filter(Order.id == order_id).first():
        order_id = _next_order_id(db)
    try:
        order = Order(id=order_id, **{k: v for k, v in payload.model_dump().items() if k != "id"})
        db.add(order)
        db.commit()
        db.refresh(order)
        return order
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Order creation failed")


@router.get("/", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.date.desc()).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: str, payload: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(order, key, value)
        db.commit()
        db.refresh(order)
        return order
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Order update failed")


@router.delete("/{order_id}")
def delete_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted"}
