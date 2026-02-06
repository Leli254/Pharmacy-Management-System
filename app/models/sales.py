# app/models/sales.py
from sqlalchemy import (
    Column, Integer, String, DateTime,
    Float, ForeignKey, Text
    )
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class SalesTransaction(Base):
    __tablename__ = "sales_transactions"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True,
                            index=True)  # e.g., RCPT-2024-001
    patient_name = Column(String, nullable=True)
    total_amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Track who sold it
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User")

    # Relationship to the items sold
    items = relationship("SaleItem", back_populates="transaction")
    prescription_info = relationship(
        "PrescriptionDetail", back_populates="transaction", uselist=False)


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("sales_transactions.id"))
    drug_id = Column(Integer, ForeignKey("drugs.id"))

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price at the time of sale
    subtotal = Column(Float, nullable=False)

    transaction = relationship("SalesTransaction", back_populates="items")
    drug = relationship("Drug")


class PrescriptionDetail(Base):
    __tablename__ = "prescription_details"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey(
        "sales_transactions.id"), nullable=False)

    patient_age = Column(String, nullable=True)
    patient_sex = Column(String, nullable=True)
    prescriber_name = Column(String, nullable=True)  # Doctor's Name
    medical_institution = Column(String, nullable=True)  # Clinic/Hospital
    # e.g., "1 tab BD for 5 days"
    dosage_instructions = Column(Text, nullable=True)

    transaction = relationship(
        "SalesTransaction", back_populates="prescription_info")

