# app/routers/audit_router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time
from pydantic import BaseModel
import structlog

from app.database.db import get_db
from app.models.stock import Drug, Product 
from app.models.stock_movement import StockMovement
from app.models.sales import SalesTransaction
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.utils.receipt_pdf import generate_receipt_pdf

logger = structlog.get_logger()
router = APIRouter(tags=["Audit"])

# --- SCHEMAS ---


class StockMovementSchema(BaseModel):
    drug_name: str
    batch_number: str
    movement_type: str
    quantity_changed: int
    reason: str
    date: date
    username: Optional[str] = None

    class Config:
        from_attributes = True


class SaleItemSchema(BaseModel):
    drug_name: str
    quantity: int
    unit_price: float
    subtotal: float


class SalesTransactionSchema(BaseModel):
    id: int
    receipt_number: str
    client_name: Optional[str]
    total_amount: float
    timestamp: datetime
    username: Optional[str]
    items: List[SaleItemSchema]

    class Config:
        from_attributes = True

# --- ROLE CHECK ---


def admin_only(current_user: User = Depends(get_current_user)):
    if current_user.role.lower() != "admin":
        logger.warn("unauthorized_audit_access",
                    user=current_user.username, role=current_user.role)
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# --- ENDPOINTS ---


@router.get("/inventory", response_model=List[StockMovementSchema])
def get_stock_audit(
    batch_number: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    log = logger.bind(user=current_user.username, view="inventory_audit")
    log.info("fetching_inventory_logs", start=start_date, end=end_date)

    # REFACTOR: Join Product table to get brand_name
    query = db.query(StockMovement, Drug, User, Product).join(
        Drug, Drug.id == StockMovement.drug_id
    ).join(
        Product, Product.id == Drug.product_id
    ).outerjoin(
        User, User.id == StockMovement.user_id
    )

    if batch_number:
        query = query.filter(Drug.batch_number == batch_number)
    if start_date:
        query = query.filter(StockMovement.created_at >=
                             datetime.combine(start_date, time.min))
    if end_date:
        query = query.filter(StockMovement.created_at <=
                             datetime.combine(end_date, time.max))

    results = query.order_by(StockMovement.id.desc()).all()

    # ALIGN: Use product.brand_name instead of drug.brand_name
    return [
        StockMovementSchema(
            drug_name=product.brand_name,
            batch_number=drug.batch_number,
            movement_type=movement.movement_type,
            quantity_changed=movement.quantity_changed,
            reason=movement.reason or "No reason provided",
            date=movement.created_at.date() if movement.created_at else date.today(),
            username=user.username if user else "System"
        ) for movement, drug, user, product in results
    ]


@router.get("/sales", response_model=List[SalesTransactionSchema])
def get_sales_history(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    log = logger.bind(user=current_user.username, view="sales_audit")
    log.info("fetching_sales_history", start=start_date, end=end_date)

    query = db.query(SalesTransaction)
    if start_date:
        query = query.filter(SalesTransaction.timestamp >=
                             datetime.combine(start_date, time.min))
    if end_date:
        query = query.filter(SalesTransaction.timestamp <=
                             datetime.combine(end_date, time.max))

    transactions = query.order_by(SalesTransaction.timestamp.desc()).all()

    result = []
    for tx in transactions:
        user = db.query(User).filter(User.id == tx.user_id).first()

        items_list = []
        for item in tx.items:
            # REFACTOR: Trace through Drug -> Product for the name
            drug_record = db.query(Drug).filter(
                Drug.id == item.drug_id).first()
            name = drug_record.product.brand_name if drug_record and drug_record.product else "Unknown Item"

            items_list.append(SaleItemSchema(
                drug_name=name,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                subtotal=float(item.subtotal)
            ))

        result.append(SalesTransactionSchema(
            id=tx.id,
            receipt_number=tx.receipt_number,
            client_name=tx.patient_name,  # Mapping patient_name to client_name schema
            total_amount=float(tx.total_amount),
            timestamp=tx.timestamp,
            username=user.username if user else "Unknown",
            items=items_list
        ))
    return result


@router.get("/reprint/{transaction_id}")
def reprint_receipt(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = logger.bind(user=current_user.username,
                      transaction_id=transaction_id)
    tx = db.query(SalesTransaction).filter(
        SalesTransaction.id == transaction_id).first()

    if not tx:
        log.error("reprint_failed_not_found")
        raise HTTPException(status_code=404, detail="Transaction not found")

    user = db.query(User).filter(User.id == tx.user_id).first()

    pdf_data = {
        "receipt_number": str(tx.receipt_number),
        "ticket_number": "REPRINT",
        "client_name": str(tx.patient_name),  # Aligned
        "total_amount": float(tx.total_amount),
        "date": tx.timestamp.strftime("%Y-%m-%d %H:%M"),
        "served_by": str(user.username if user else "System"),
        "items": []
    }

    for item in tx.items:
        # REFACTOR: Correctly fetch name via Product relationship
        drug_record = db.query(Drug).filter(Drug.id == item.drug_id).first()
        name = drug_record.product.brand_name if drug_record and drug_record.product else "Item"

        pdf_data["items"].append({
            "name": str(name),
            "qty": int(item.quantity),
            "price": float(item.unit_price),
            "subtotal": float(item.subtotal)
        })

    log.info("generating_reprint_pdf", receipt_no=tx.receipt_number)
    pdf_buffer = generate_receipt_pdf(pdf_data)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reprint_{tx.receipt_number}.pdf",
            # Added for frontend visibility
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
