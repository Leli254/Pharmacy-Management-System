# app/routers/stock_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from pydantic import BaseModel

# ← central dependency (recommended)
from app.database.db import get_db
from app.models.stock import Drug
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.dependencies.auth import get_current_user

# No prefix here — we control it in main.py
router = APIRouter(tags=["Stock"])


# -------------------------
# Pydantic Schemas
# -------------------------
class DrugSchema(BaseModel):
    name: str
    batch_number: str
    expiry_date: date
    quantity: int
    unit_price: float
    is_controlled: bool = False

    model_config = {
        "from_attributes": True
    }


class SellStockSchema(BaseModel):
    batch_number: str
    quantity: int


class SellStockResponseSchema(BaseModel):
    message: str
    drug: DrugSchema
    warning: Optional[str] = None


# -------------------------
# Add New Stock (Receiving)
# -------------------------
@router.post("/", response_model=DrugSchema)
def add_stock(
    drug: DrugSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)          # ← uses central get_db
):
    db_drug = Drug(**drug.dict())
    db.add(db_drug)
    db.commit()
    db.refresh(db_drug)

    # Log stock receipt with current user
    db.add(
        StockMovement(
            drug_id=db_drug.id,
            movement_type="RECEIVE",
            quantity_changed=drug.quantity,
            reason="Stock received",
            user_id=current_user.id
        )
    )
    db.commit()

    return db_drug


# -------------------------
# View Current Stock
# -------------------------
@router.get("/", response_model=List[DrugSchema])
def view_stock(db: Session = Depends(get_db)):
    return db.query(Drug).all()


# -------------------------
# Sell Stock Safely
# -------------------------
@router.post("/sell", response_model=SellStockResponseSchema)
def sell_stock(
    sale: SellStockSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    drug = db.query(Drug).filter(
        Drug.batch_number == sale.batch_number).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Batch not found")

    if drug.expiry_date < date.today():
        raise HTTPException(
            status_code=400, detail="Cannot sell expired stock")

    if sale.quantity > drug.quantity:
        raise HTTPException(
            status_code=400, detail="Insufficient stock quantity")

    # Deduct stock
    drug.quantity -= sale.quantity

    # Log sale with user
    movement = StockMovement(
        drug_id=drug.id,
        movement_type="SALE",
        quantity_changed=-sale.quantity,
        reason="Dispensed to customer",
        user_id=current_user.id
    )
    db.add(movement)
    db.commit()
    db.refresh(drug)

    response = {
        "message": "Stock sold successfully",
        "drug": drug
    }

    if drug.is_controlled:
        response["warning"] = "This medicine requires a controlled-drug register entry."

    return response
