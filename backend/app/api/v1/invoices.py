import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from datetime import datetime

router = APIRouter()


def _next_invoice_id(db: Session) -> str:
    year = datetime.now().year
    invoices = db.query(Invoice).filter(Invoice.id.like(f"INV-{year}-%")).all()
    if not invoices:
        return f"INV-{year}-001"
    nums = []
    for inv in invoices:
        m = re.match(rf"INV-{year}-(\d+)", inv.id)
        if m:
            nums.append(int(m.group(1)))
    return f"INV-{year}-{str(max(nums) + 1).zfill(3)}"


@router.post("/", response_model=InvoiceResponse, status_code=201)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    invoice_id = payload.id or _next_invoice_id(db)
    try:
        invoice = Invoice(id=invoice_id, **{k: v for k, v in payload.model_dump().items() if k != "id"})
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Invoice creation failed")


@router.get("/", response_model=list[InvoiceResponse])
def list_invoices(db: Session = Depends(get_db)):
    return db.query(Invoice).all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: str, payload: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(invoice, key, value)
        db.commit()
        db.refresh(invoice)
        return invoice
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Invoice update failed")


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted"}
