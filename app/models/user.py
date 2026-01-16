# app/models/user.py
from sqlalchemy import Boolean, Column, Integer, String
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="staff")  # e.g., manager, dispenser
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)