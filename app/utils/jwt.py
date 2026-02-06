# app/utils/jwt.py
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.database.db import SessionLocal
from app.models.user import User
from app.core.config import settings

# -------------------------
# Hashing Contexts
# -------------------------
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# --- Password Helpers (Argon2) ---


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generates an Argon2 hash from a plain password."""
    return pwd_context.hash(password)

# --- PIN Helpers (Raw Bcrypt) ---


def get_pin_hash(pin: str) -> str:
    """Generates a Bcrypt hash using the raw library for frontend compatibility."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pin.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verifies a 4-digit PIN against a Bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_pin.encode('utf-8'), hashed_pin.encode('utf-8'))
    except Exception:
        return False

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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# -------------------------
# JWT helpers
# -------------------------


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})

    # Use .get_secret_value() because SECRET_KEY is a Pydantic SecretStr
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=settings.ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    try:
        # Use .get_secret_value() because SECRET_KEY is a Pydantic SecretStr
        payload = jwt.decode(
            token,
            settings.SECRET_KEY.get_secret_value(),
            algorithms=[settings.ALGORITHM]
        )
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
# Login helper
# -------------------------


def login_user(db: Session, username: str, password: str) -> str:
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(
        data={"sub": user.username, "id": user.id}
    )
    return access_token
