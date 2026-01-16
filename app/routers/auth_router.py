# app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated

# ← import the proper dependency
from app.database.db import get_db
from app.models.user import User
from app.schemas.user import UserCreateSchema, UserReadSchema, TokenSchema
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token

router = APIRouter(tags=["Auth"])  # ← NO prefix here!


@router.post(
    "/signup",
    response_model=UserReadSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    responses={
        400: {"description": "Username already exists"},
        422: {"description": "Validation error"}
    }
)
def signup(
    user_in: UserCreateSchema,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new user account.
    - Checks for duplicate username
    - Hashes password securely
    - Returns basic user info (without password)
    """
    existing_user = db.query(User).filter(
        User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Optional: add more validations (email unique, password strength, etc.)
    # if len(user_in.password) < 8:
    #     raise HTTPException(400, "Password must be at least 8 characters")

    new_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        role=user_in.role,
        hashed_password=hash_password(user_in.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenSchema,
    summary="Login and get access token"
)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)]
):
    """
    OAuth2 compatible token login.
    Returns JWT access token.
    """
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
