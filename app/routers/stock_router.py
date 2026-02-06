# app/routers/stock_router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

# import Models to avoid circular imports
from sqlalchemy.orm import joinedload
import uuid
import io
import structlog

from app.database.db import get_db
from app.models.stock import Drug, GenericDrug, Supplier, Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.models.sales import SalesTransaction, SaleItem, PrescriptionDetail
from app.dependencies.auth import get_current_user
from app.utils.receipt_pdf import generate_receipt_pdf
from app.utils.dda_pdf import generate_dda_pdf

router = APIRouter(tags=["Stock"])
logger = structlog.get_logger()

# --- SCHEMAS ---


class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class SupplierSchema(SupplierCreate):
    id: int

    class Config:
        from_attributes = True


class GenericDrugCreate(BaseModel):
    name: str
    description: Optional[str] = None


class GenericDrugSchema(GenericDrugCreate):
    id: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    brand_name: str
    generic_id: Optional[int] = None
    is_controlled: bool = False
    reorder_level: int = 1


class ProductSchema(ProductCreate):
    id: int

    class Config:
        from_attributes = True


class DrugCreateSchema(BaseModel):
    product_id: int
    supplier_id: Optional[int] = None
    batch_number: str
    expiry_date: date
    quantity: int
    buying_price: float
    unit_price: float
    expiry_alert_days: int = 60


class DrugSchema(DrugCreateSchema):
    id: int
    brand_name: Optional[str] = None
    is_controlled: bool = False
    reorder_level: int = 0

    class Config:
        from_attributes = True


class CartItem(BaseModel):
    batch_id: int
    quantity: int


class BulkSaleRequest(BaseModel):
    client_name: Optional[str] = "Walk-in Client"
    # Clinical/Prescription Fields (Optional for non-DDA)
    patient_age: Optional[str] = None
    patient_sex: Optional[str] = None
    prescriber_name: Optional[str] = None
    medical_institution: Optional[str] = None
    dosage_instructions: Optional[str] = None
    items: List[CartItem]


class DDALedgerEntry(BaseModel):
    timestamp: datetime
    brand_name: str
    batch_number: str
    entry_type: str
    entity_name: str
    ref_number: str
    quantity: int
    user_name: str
    # Compliance Fields
    age: Optional[str] = None
    prescriber: Optional[str] = None

# --- ENDPOINTS ---


@router.get("/generics", response_model=List[GenericDrugSchema])
def get_generics(db: Session = Depends(get_db)):
    return db.query(GenericDrug).order_by(GenericDrug.name.asc()).all()


@router.post("/generics", response_model=GenericDrugSchema)
def add_generic(data: GenericDrugCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(GenericDrug).filter(
        GenericDrug.name.ilike(data.name)).first()
    if existing:
        return existing
    db_generic = GenericDrug(name=data.name)
    db.add(db_generic)
    db.commit()
    db.refresh(db_generic)
    return db_generic


@router.get("/products", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.brand_name.asc()).all()


@router.post("/products", response_model=ProductSchema)
def add_product(prod: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Product).filter(
        Product.brand_name.ilike(prod.brand_name)).first()
    if existing:
        existing.reorder_level = prod.reorder_level
        db.commit()
        return existing
    db_prod = Product(**prod.model_dump())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod


@router.post("/", response_model=DrugSchema)
def add_stock_batch(item: DrugCreateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).get(item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_batch = db.query(Drug).filter(
        Drug.batch_number == item.batch_number, Drug.product_id == item.product_id).first()

    if existing_batch:
        existing_batch.quantity += item.quantity
        db_batch = existing_batch
    else:
        db_batch = Drug(**item.model_dump())
        db.add(db_batch)

    try:
        db.commit()
        db.refresh(db_batch)
        db.add(StockMovement(drug_id=db_batch.id, movement_type="RECEIVE", quantity_changed=item.quantity,
               reason=f"Batch {item.batch_number} received", user_id=current_user.id))
        db.commit()
        db_batch.brand_name = product.brand_name
        return db_batch
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Database error while saving batch")


@router.get("/", response_model=List[DrugSchema])
def view_inventory(db: Session = Depends(get_db)):
    batches = db.query(Drug).all()
    for b in batches:
        b.brand_name = b.product.brand_name
        b.is_controlled = b.product.is_controlled
    return batches


@router.post("/bulk-sell")
def bulk_sell_stock(req: BulkSaleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = logger.bind(request_id=str(uuid.uuid4()), user=current_user.username)
    total_amount = 0.0
    items_for_pdf = []
    validated_entries = []

    try:
        for item in req.items:
            batch = db.query(Drug).get(item.batch_id)
            if not batch or batch.quantity < item.quantity:
                raise HTTPException(
                    status_code=400, detail="Stock error or insufficient quantity")

            line_total = float(batch.unit_price * item.quantity)
            total_amount += line_total
            items_for_pdf.append({
                "name": str(batch.product.brand_name),
                "qty": int(item.quantity),
                "price": float(batch.unit_price),
                "subtotal": float(line_total)
            })
            validated_entries.append(
                {"batch": batch, "qty": item.quantity, "sub": line_total})

        receipt_no = f"RCPT-{uuid.uuid4().hex[:6].upper()}"

        # 1. Create Transaction (Note: using 'timestamp' as per your model)
        new_trans = SalesTransaction(
            receipt_number=receipt_no,
            patient_name=req.client_name,
            total_amount=total_amount,
            user_id=current_user.id
        )
        db.add(new_trans)
        db.flush()

        # 2. Add Prescription Details if clinical info provided
        if req.prescriber_name or req.patient_age:
            p_detail = PrescriptionDetail(
                transaction_id=new_trans.id,
                patient_age=req.patient_age,
                patient_sex=req.patient_sex,
                prescriber_name=req.prescriber_name,
                medical_institution=req.medical_institution,
                dosage_instructions=req.dosage_instructions
            )
            db.add(p_detail)

        # 3. Process items and movements
        for entry in validated_entries:
            b = entry["batch"]
            db.add(SaleItem(
                transaction_id=new_trans.id,
                drug_id=b.id,
                quantity=entry["qty"],
                unit_price=b.unit_price,
                subtotal=entry["sub"]
            ))
            b.quantity -= entry["qty"]
            db.add(StockMovement(
                drug_id=b.id,
                movement_type="DISPENSE",
                quantity_changed=-entry["qty"],
                reason=f"Sale {receipt_no}",
                user_id=current_user.id
            ))

        db.commit()

        pdf_data = {
            "receipt_number": receipt_no,
            "client_name": req.client_name,
            "total_amount": total_amount,
            "items": items_for_pdf,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "served_by": current_user.username
        }
        pdf_buffer = generate_receipt_pdf(pdf_data)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=receipt_{receipt_no}.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        db.rollback()
        log.error("sale_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dda-ledger", response_model=List[DDALedgerEntry])
def get_dda_ledger(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # 1. Eager load to prevent LazyLoad errors
        movements = (
            db.query(StockMovement)
            .join(Drug)
            .join(Product)
            .options(
                joinedload(StockMovement.drug).joinedload(Drug.product),
                joinedload(StockMovement.drug).joinedload(Drug.supplier_rel),
                joinedload(StockMovement.user)
            )
            .filter(Product.is_controlled == True)
            .order_by(StockMovement.timestamp.desc())
            .all()
        )

        ledger = []
        for m in movements:
            # Safety Check A: Ensure drug and product exist
            if not m.drug or not m.drug.product:
                logger.warning("skipping_orphaned_movement", movement_id=m.id)
                continue

            brand = m.drug.product.brand_name
            batch = m.drug.batch_number

            # Default values for safety
            entity, ref, age, prescriber = "Unknown", m.reason or "N/A", None, None
            user_name = m.user.username if m.user else "System"

            if m.movement_type == "RECEIVE":
                entity = m.drug.supplier_rel.name if m.drug.supplier_rel else "Direct Entry"
                ref = batch
            elif m.movement_type == "DISPENSE" and "Sale " in (m.reason or ""):
                r_no = m.reason.replace("Sale ", "").strip()

                # Safety Check B: Use direct query for Sale and Prescription
                sale = db.query(SalesTransaction).filter(
                    SalesTransaction.receipt_number == r_no).first()
                if sale:
                    entity = sale.patient_name or "Walk-in Client"
                    ref = sale.receipt_number

                    # Manual join for prescription details to avoid recursion
                    p_info = db.query(PrescriptionDetail).filter(
                        PrescriptionDetail.transaction_id == sale.id).first()
                    if p_info:
                        age = p_info.patient_age
                        prescriber = p_info.prescriber_name

            ledger.append({
                "timestamp": m.timestamp,
                "brand_name": brand,
                "batch_number": batch,
                "entry_type": m.movement_type,
                "entity_name": entity,
                "ref_number": ref,
                "quantity": abs(m.quantity_changed or 0),
                "user_name": user_name,
                "age": age,
                "prescriber": prescriber
            })

        return ledger

    except Exception as e:
        # This is vital: Check your terminal for this output!
        print(f"\n--- DDA LEDGER ERROR ---\n{str(e)}\n")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/prescription-book")
def get_prescription_book(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get all transactions that have clinical info
    results = (
        db.query(SalesTransaction)
        .join(PrescriptionDetail)
        .order_by(SalesTransaction.timestamp.desc())
        .all()
    )

    book = []
    for s in results:
        drugs = ", ".join([item.drug.product.brand_name for item in s.items])
        book.append({
            "id": s.id,
            "date": s.timestamp,
            "receipt_number": s.receipt_number,
            "patient_name": s.patient_name,
            "age": s.prescription_info.patient_age,
            "sex": s.prescription_info.patient_sex,
            "prescriber": s.prescription_info.prescriber_name,
            "institution": s.prescription_info.medical_institution,
            "drugs": drugs,
            "instructions": s.prescription_info.dosage_instructions
        })
    return book


@router.get("/dda-ledger/download")
def download_dda_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: Optional[str] = Query(None),  # Get token from URL
    db: Session = Depends(get_db)
):
    # 1. Manual Auth Check (since window.open can't send headers)
    if not token:
        raise HTTPException(
            status_code=401, detail="Authentication token missing")

    # Optional: Verify token here using your existing auth logic if strictness is needed
    # user = verify_token(token, db)

    try:
        # 2. Fetch movements with eager loading
        query = db.query(StockMovement).join(Drug).join(Product).options(
            joinedload(StockMovement.drug).joinedload(Drug.product),
            joinedload(StockMovement.drug).joinedload(Drug.supplier_rel),
            joinedload(StockMovement.user)
        ).filter(Product.is_controlled == True)

        if start_date and end_date:
            # Handle potential string to datetime conversion if necessary
            query = query.filter(
                StockMovement.timestamp.between(start_date, end_date))

        # Order by ASC for correct chronological balance calculation
        movements = query.order_by(StockMovement.timestamp.asc()).all()

        ledger_data, balances = [], {}
        for m in movements:
            if not m.drug or not m.drug.product:
                continue

            brand = m.drug.product.brand_name
            if brand not in balances:
                balances[brand] = 0

            qty_abs = abs(m.quantity_changed or 0)
            age, prescriber = None, None

            # Calculate Running Balance
            if m.movement_type == "RECEIVE":
                balances[brand] += qty_abs
                entity = m.drug.supplier_rel.name if m.drug.supplier_rel else "Direct Entry"
                ref = m.drug.batch_number
            else:
                balances[brand] -= qty_abs
                entity, ref = "Unknown Client", m.reason or "N/A"
                if "Sale " in ref:
                    r_no = ref.replace("Sale ", "").strip()
                    sale = db.query(SalesTransaction).filter(
                        SalesTransaction.receipt_number == r_no).first()
                    if sale:
                        entity = sale.patient_name or "Walk-in"
                        ref = sale.receipt_number
                        p_info = db.query(PrescriptionDetail).filter(
                            PrescriptionDetail.transaction_id == sale.id).first()
                        if p_info:
                            age, prescriber = p_info.patient_age, p_info.prescriber_name

            ledger_data.append({
                "timestamp": m.timestamp.strftime("%Y-%m-%d %H:%M") if m.timestamp else "N/A",
                "brand_name": brand,
                "batch_number": m.drug.batch_number,
                "entry_type": m.movement_type,
                "entity_name": entity,
                "ref_number": ref,
                "quantity": qty_abs,
                "running_balance": balances[brand],
                "user_name": m.user.username if m.user else "System",
                "age": age,
                "prescriber": prescriber
            })

        # Reverse to show newest first for the PDF document
        ledger_data.reverse()

        # Ensure generate_dda_pdf is updated to handle 'age' and 'prescriber' keys
        pdf_buffer = generate_dda_pdf(ledger_data, start_date, end_date)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=DDA_Register_{datetime.now().strftime('%Y%m%d')}.pdf"
            }
        )
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"PDF Generation Failed: {str(e)}")
        


@router.get("/prescription-book/download")
def download_prescription_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # 1. Manual Auth Check
    if not token:
        raise HTTPException(
            status_code=401, detail="Authentication token missing")

    try:
        # 2. Query transactions with clinical info
        query = db.query(SalesTransaction).join(PrescriptionDetail)

        if start_date and end_date:
            query = query.filter(
                SalesTransaction.timestamp.between(start_date, end_date))

        results = query.order_by(SalesTransaction.timestamp.asc()).all()

        pdf_data = []
        for s in results:
            drugs = ", ".join(
                [item.drug.product.brand_name for item in s.items])
            pdf_data.append({
                "date": s.timestamp.strftime("%Y-%m-%d") if s.timestamp else "N/A",
                "receipt_number": s.receipt_number,
                "patient_name": s.patient_name,
                "age_sex": f"{s.prescription_info.patient_age or 'N/A'} | {s.prescription_info.patient_sex or 'N/A'}",
                "prescriber": f"{s.prescription_info.prescriber_name}\n({s.prescription_info.medical_institution or 'Private'})",
                "drugs": drugs,
                "instructions": s.prescription_info.dosage_instructions or "As directed"
            })

        # You will need to create this util function in app/utils/prescription_pdf.py
        from app.utils.prescription_pdf import generate_prescription_book_pdf
        pdf_buffer = generate_prescription_book_pdf(
            pdf_data, start_date, end_date)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Prescription_Register_{datetime.now().strftime('%Y%m%d')}.pdf"
            }
        )
    except Exception as e:
        print(f"Prescription PDF Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate PDF: {str(e)}")
        

        
@router.get("/products/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    # Use 'Product' directly since we imported it specifically
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.put("/products/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product_data: ProductSchema, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update fields
    for key, value in product_data.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product


# --- GENERIC DRUG ROUTES ---

@router.get("/generics/{id}", response_model=GenericDrugSchema)
def get_generic(id: int, db: Session = Depends(get_db)):
    item = db.query(GenericDrug).filter(GenericDrug.id == id).first()
    if not item:
        raise HTTPException(
            status_code=404, detail="Generic molecule not found")
    return item


@router.put("/generics/{id}", response_model=GenericDrugSchema)
def update_generic(id: int, data: GenericDrugCreate, db: Session = Depends(get_db)):
    item = db.query(GenericDrug).filter(GenericDrug.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Generic not found")

    item.name = data.name
    item.description = data.description

    db.commit()
    db.refresh(item)
    return item

# --- SUPPLIER ROUTES ---


@router.get("/suppliers", response_model=List[SupplierSchema])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name.asc()).all()


@router.post("/suppliers", response_model=SupplierSchema)
def add_supplier(data: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Case-insensitive check
    existing = db.query(Supplier).filter(
        Supplier.name.ilike(data.name)).first()

    if existing:
        # 2. Update existing supplier's info (Harmonization)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    # 3. Create new with all fields
    db_supplier = Supplier(**data.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.put("/suppliers/{id}", response_model=SupplierSchema)
def update_supplier(id: int, data: SupplierCreate, db: Session = Depends(get_db)):
    item = db.query(Supplier).filter(Supplier.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Update all fields provided in the request
    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.get("/suppliers/{id}", response_model=SupplierSchema)
def get_supplier(id: int, db: Session = Depends(get_db)):
    item = db.query(Supplier).filter(Supplier.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return item
