from sqlalchemy import Column, Integer, String, Date, Float, Boolean
from app.database.db import Base


class Drug(Base):
    __tablename__ = "drugs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    batch_number = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, default=0)
    unit_price = Column(Float, nullable=False)
    is_controlled = Column(Boolean, default=False)  # DDA / antibiotic register
    supplier = Column(String, nullable=True)