# app/routers/auth_router.py
from pydantic import BaseModel
from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.utils.jwt import (
    get_current_user,
    create_access_token,
    get_password_hash,
    get_pin_hash,
    verify_password,
    get_db
)
from app.models.user import User
from app.schemas.user import UserCreateSchema, UserReadSchema

router = APIRouter(tags=["Auth"])

# --- Schemas ---


class PasswordResetSchema(BaseModel):
    username: str
    new_password: str

# --- Endpoints ---


@router.post(
    "/signup",
    response_model=UserReadSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
def signup(
    user_in: UserCreateSchema,
    db: Annotated[Session, Depends(get_db)]
):
    existing_user = db.query(User).filter(
        User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    user_count = db.query(User).count()
    assigned_role = "admin" if user_count == 0 else "staff"

    new_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        role=assigned_role,
        hashed_password=get_password_hash(user_in.password),
        recovery_pin_hash=get_pin_hash(user_in.recovery_pin),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", summary="Login and get access token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)]
):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "recovery_pin_hash": user.recovery_pin_hash
    }


@router.get("/recovery-data/{username}")
def get_recovery_data(username: str, db: Annotated[Session, Depends(get_db)]):
    """Fallback endpoint to fetch PIN hash if cache is cleared but user is online"""
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.recovery_pin_hash:
        raise HTTPException(status_code=404, detail="Recovery not set up")

    return {
        "username": user.username,
        "recovery_pin_hash": user.recovery_pin_hash
    }


@router.post("/reset-password-sync")
def reset_password_sync(data: PasswordResetSchema, db: Annotated[Session, Depends(get_db)]):
    """Updates the database with the new password generated during offline recovery"""
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password synced"}


@router.get("/users", response_model=List[UserReadSchema])
def get_all_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).all()
