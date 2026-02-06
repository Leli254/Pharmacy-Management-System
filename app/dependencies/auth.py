# app/dependencies/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.models.user import User
from app.utils.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compares a plain text password with a hash.
    Returns True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)
