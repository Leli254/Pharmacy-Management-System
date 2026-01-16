from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
from pydantic import BaseModel

from app.database.db import SessionLocal
from app.models.stock import Drug

router = APIRouter(prefix="/alerts", tags=["Alerts"])


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
# Response Schemas
# -------------------------
class DrugAlertSchema(BaseModel):
    name: str
    batch_number: str
    expiry_date: date
    quantity: int
    unit_price: float
    is_controlled: bool

    model_config = {
        "from_attributes": True
    }


class AlertResponseSchema(BaseModel):
    near_expiry: List[DrugAlertSchema]
    low_stock: List[DrugAlertSchema]
    controlled_drugs_attention: List[DrugAlertSchema]
    note: str


# -------------------------
# Alerts Endpoint
# -------------------------
@router.get("/", response_model=AlertResponseSchema)
def get_alerts(
    days: int = 30,
    low_stock_threshold: int = 10,
    db: Session = Depends(get_db)
):
    """
    Returns:
    - Drugs expiring within X days
    - Drugs below low stock threshold
    - Controlled drugs that need extra attention
    """

    today = date.today()
    expiry_cutoff = today + timedelta(days=days)

    near_expiry = db.query(Drug).filter(
        Drug.expiry_date <= expiry_cutoff
    ).all()

    low_stock = db.query(Drug).filter(
        Drug.quantity <= low_stock_threshold
    ).all()

    # Controlled drugs that appear in either alert group
    controlled_drugs_attention = [
        drug for drug in set(near_expiry + low_stock)
        if drug.is_controlled
    ]

    return {
        "near_expiry": near_expiry,
        "low_stock": low_stock,
        "controlled_drugs_attention": controlled_drugs_attention,
        "note": "Ensure physical DDA / antibiotic registers are updated where required"
    }
