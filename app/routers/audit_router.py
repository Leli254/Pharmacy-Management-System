# app/routers/audit_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
import logging

from app.database.db import get_db
from app.models.stock import Drug
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Audit"])


class StockMovementSchema(BaseModel):
    drug_name: str
    batch_number: str
    movement_type: str
    quantity_changed: int
    reason: str
    date: date
    username: Optional[str] = None

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[StockMovementSchema])
def get_stock_audit(
    batch_number: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(StockMovement, Drug, User).join(
            Drug, Drug.id == StockMovement.drug_id
        ).outerjoin(User, User.id == StockMovement.user_id)

        if batch_number:
            query = query.filter(Drug.batch_number == batch_number)

        movements = query.order_by(StockMovement.id.desc()).all()

        result = []
        for movement, drug, user in movements:
            # Safe date handling
            movement_date = date.today()
            if movement.created_at is not None:
                try:
                    movement_date = movement.created_at.date()
                except AttributeError as e:
                    logger.warning(
                        f"Invalid date format for movement {movement.id}: {e}")

            result.append(
                StockMovementSchema(
                    drug_name=drug.name,
                    batch_number=drug.batch_number,
                    movement_type=movement.movement_type,
                    quantity_changed=movement.quantity_changed,
                    reason=movement.reason,
                    date=movement_date,
                    username=user.username if user else None
                )
            )

        logger.info(f"Returning {len(result)} audit records")
        return result

    except Exception as e:
        logger.exception("Error in get_stock_audit endpoint")
        raise  # Re-raise to let FastAPI return 500 with detail
