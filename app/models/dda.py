# app/models/dda.py  
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base
from datetime import datetime, timezone


class DDARegister(Base):
    __tablename__ = "dda_register"

    id = Column(Integer, primary_key=True, index=True)

    # Links
    drug_id = Column(Integer, ForeignKey("drugs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Transaction Details
    entry_type = Column(String)  # "IN" (Received) or "OUT" (Sold/Dispensed)

    # Timestamp
    timestamp = Column(DateTime(timezone=True),
                       default=lambda: datetime.now(timezone.utc))

    # Party Details
    # Supplier Name OR Patient Name
    person_entity_name = Column(String, nullable=False)
    prescription_invoice_ref = Column(
        String, nullable=True)  # Rx Number or Invoice Number

    # Quantity Accounting
    quantity_in = Column(Integer, default=0)
    quantity_out = Column(Integer, default=0)
    # Running total at time of entry
    balance_after = Column(Integer, nullable=False)

    # Metadata
    batch_number = Column(String)
    remarks = Column(String, nullable=True)

    # Relationships
    drug = relationship("Drug")
    user = relationship("User")
    dda_audit_logs = relationship(
        "DDAAuditLog", back_populates="dda_register", cascade="all, delete-orphan")