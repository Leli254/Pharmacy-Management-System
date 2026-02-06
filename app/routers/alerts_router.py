# app/routers/alerts_router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from typing import List
from pydantic import BaseModel
import io

# ReportLab Imports
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from app.database.db import get_db
from app.models.stock import Drug, Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(tags=["Alerts"])

# --- SCHEMAS ---


class DrugAlertSchema(BaseModel):
    id: int
    brand_name: str
    batch_number: str
    expiry_date: date
    quantity: int
    unit_price: float
    is_controlled: bool
    reorder_level: int
    expiry_alert_days: int

    class Config:
        from_attributes = True


class AlertResponseSchema(BaseModel):
    near_expiry: List[DrugAlertSchema]
    low_stock: List[DrugAlertSchema]
    controlled_attention: List[DrugAlertSchema]
    note: str


class ReconcileRequest(BaseModel):
    drug_id: int
    physical_quantity: int

# --- HELPERS ---


def map_drug_to_schema(drug: Drug) -> DrugAlertSchema:
    return DrugAlertSchema(
        id=drug.id,
        brand_name=drug.product.brand_name,
        batch_number=drug.batch_number,
        expiry_date=drug.expiry_date,
        quantity=drug.quantity,
        unit_price=drug.unit_price,
        is_controlled=drug.product.is_controlled,
        reorder_level=drug.product.reorder_level,
        expiry_alert_days=drug.expiry_alert_days
    )


def calculate_alert_type(item: Drug) -> str:
    """Helper to determine the status label for the checklist"""
    is_low = item.quantity <= item.product.reorder_level
    # Check if expiring within 60 days
    is_near_expiry = (item.expiry_date - date.today()).days <= 60

    if is_low and is_near_expiry:
        return "LOW & EXPIRING"
    if is_low:
        return "LOW STOCK"
    if is_near_expiry:
        return "EXPIRY"
    return "HEALTHY"

# --- ENDPOINTS ---


@router.get("/", response_model=AlertResponseSchema)
def get_pharmacy_alerts(db: Session = Depends(get_db)):
    today = date.today()

    # 1. Near Expiry (Using configured alert days)
    near_expiry_raw = db.query(Drug).join(Product).filter(
        Drug.quantity > 0,
        ~Drug.batch_number.ilike("PLACEHOLDER-%"),
        text("expiry_date - (expiry_alert_days * interval '1 day') <= CURRENT_DATE")
    ).order_by(Drug.expiry_date.asc()).all()

    # 2. Low Stock
    low_stock_raw = db.query(Drug).join(Product).filter(
        Drug.quantity <= Product.reorder_level,
        ~Drug.batch_number.ilike("PLACEHOLDER-%")
    ).order_by(Drug.quantity.asc()).all()

    # 3. Controlled Substances
    controlled_raw = db.query(Drug).join(Product).filter(
        Product.is_controlled == True,
        Drug.quantity > 0,
        ~Drug.batch_number.ilike("PLACEHOLDER-%")
    ).order_by(Product.brand_name.asc()).all()

    return {
        "near_expiry": [map_drug_to_schema(d) for d in near_expiry_raw],
        "low_stock": [map_drug_to_schema(d) for d in low_stock_raw],
        "controlled_attention": [map_drug_to_schema(d) for d in controlled_raw],
        "note": f"System scan complete for {today.strftime('%d %b %Y')}."
    }


@router.get("/checklist")
def get_checklist(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns ALL batches in stock for a full dispensary audit"""
    items = db.query(Drug).join(Product).filter(
        Drug.quantity > 0,
        ~Drug.batch_number.ilike("PLACEHOLDER-%")
    ).order_by(Product.brand_name.asc()).all()

    return [{
        "id": item.id,
        "brand_name": item.product.brand_name,
        "batch_number": item.batch_number,
        "expiry_date": str(item.expiry_date),
        "quantity_digital": item.quantity,
        "alert_type": calculate_alert_type(item)
    } for item in items]


@router.post("/reconcile")
def reconcile_stock(req: ReconcileRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Endpoint to update physical stock levels during audit"""
    drug = db.query(Drug).filter(Drug.id == req.drug_id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug batch not found")

    diff = req.physical_quantity - drug.quantity
    if diff == 0:
        return {"status": "no change needed"}

    # Update quantity
    drug.quantity = req.physical_quantity

    # Log the movement
    db.add(StockMovement(
        drug_id=drug.id,
        movement_type="RECONCILE",
        quantity_changed=diff,
        reason=f"Manual audit reconciliation by {current_user.username}",
        user_id=current_user.id
    ))

    db.commit()
    return {"status": "success", "new_quantity": drug.quantity}


@router.get("/checklist/pdf")
def download_checklist_pdf(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Generates a professional PDF of the full inventory checklist"""
    items = db.query(Drug).join(Product).filter(
        Drug.quantity > 0,
        ~Drug.batch_number.ilike("PLACEHOLDER-%")
    ).order_by(Product.brand_name.asc()).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # Title and Meta
    elements.append(
        Paragraph("Full Dispensary Inventory Checklist", styles['Title']))
    elements.append(Paragraph(
        f"Audit Date: {date.today().strftime('%d %b %Y')}", styles['Normal']))
    elements.append(
        Paragraph(f"Generated by: {current_user.username}", styles['Normal']))
    elements.append(Spacer(1, 15))

    # Table Setup
    data = [["Brand Name", "Batch", "Expiry", "System Qty", "Physical Count"]]
    for item in items:
        data.append([
            item.product.brand_name,
            item.batch_number,
            str(item.expiry_date),
            str(item.quantity),
            "__________"  # Line for manual handwriting
        ])

    table = Table(data, colWidths=[180, 80, 80, 60, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=full_audit_{date.today()}.pdf"}
    )
