# app/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.database.db import SessionLocal
from app.models.user import User

# -------------------------
# Config
# -------------------------
SECRET_KEY = "replace-this-with-a-strong-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# -------------------------
# Password hashing
# -------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# -------------------------
# Database dependency
# -------------------------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# OAuth2 scheme
# -------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# -------------------------
# JWT helpers
# -------------------------


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(
        timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# -------------------------
# User utilities
# -------------------------


def get_user(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

# -------------------------
# Dependency: current user
# -------------------------


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = get_user(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# -------------------------
# Example: login endpoint
# -------------------------


def login_user(db: Session, username: str, password: str) -> str:
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return access_token
