from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, create_access_token


def authenticate(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return create_access_token({"sub": user.username})
