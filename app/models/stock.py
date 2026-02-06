# app/models/stock.py

from sqlalchemy import (
    Column, Integer, String, Date, Float, Boolean, ForeignKey
    )
from sqlalchemy.orm import relationship
from app.database.db import Base


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    # When a supplier is deleted, associated batches stay but supplier_id becomes NULL
    batches = relationship("Drug", back_populates="supplier_rel")


class GenericDrug(Base):
    __tablename__ = "generic_drugs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    # When a generic is deleted, associated products stay but generic_id becomes NULL
    products = relationship("Product", back_populates="generic")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String, unique=True, index=True, nullable=False)

    # UPDATED: Added ondelete="SET NULL"
    generic_id = Column(Integer, ForeignKey(
        "generic_drugs.id", ondelete="SET NULL"), nullable=True)

    is_controlled = Column(Boolean, default=False)
    reorder_level = Column(Integer, default=1)

    generic = relationship("GenericDrug", back_populates="products")
    batches = relationship("Drug", back_populates="product")


class Drug(Base):
    """Represents a specific physical Batch of a Product"""
    __tablename__ = "drugs"
    id = Column(Integer, primary_key=True, index=True)

    # UPDATED: Changed nullable to True and added ondelete="SET NULL"
    # This ensures the Batch remains even if the Brand (Product) is deleted
    product_id = Column(Integer, ForeignKey(
        "products.id", ondelete="SET NULL"), nullable=True)

    # UPDATED: Added ondelete="SET NULL"
    supplier_id = Column(Integer, ForeignKey(
        "suppliers.id", ondelete="SET NULL"), nullable=True)

    batch_number = Column(String, index=True, nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, default=0)
    buying_price = Column(Float, nullable=False, default=0.0)
    unit_price = Column(Float, nullable=False)  # Selling Price

    expiry_alert_days = Column(Integer, default=60)

    product = relationship("Product", back_populates="batches")
    supplier_rel = relationship("Supplier", back_populates="batches")
