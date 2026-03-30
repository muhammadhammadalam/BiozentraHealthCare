from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import LoginRequest
from app.services.auth_services import authenticate

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token = authenticate(db, data.email, data.password)
    if not token:
        raise HTTPException(401, "Invalid credentials")
    return {"access_token": token}
