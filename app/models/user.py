# app/models/user.py
from sqlalchemy import Boolean, Column, Integer, String
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="staff")  # e.g., admin, staff
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Simple Recovery Field
    # Stores a 4-digit PIN hashed using Bcrypt for frontend compatibility
    recovery_pin_hash = Column(String, nullable=False)
