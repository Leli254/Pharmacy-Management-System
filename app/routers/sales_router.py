# app/routers/sales_router.py
from sqlalchemy.orm import joinedload  # <--- Add this import
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Annotated
from fastapi.responses import StreamingResponse
from app.utils.reports import generate_excel_report, generate_pdf_report

from app.database.db import get_db
from app.models.user import User
from app.models.sales import SalesTransaction, SaleItem
# Import Product to get names for charts
from app.models.stock import Drug, Product
from app.utils.jwt import get_current_user

# Keep the internal router clean; prefixing happens in main.py
router = APIRouter()


@router.get("/my-sales")
def get_personal_sales(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start_date: date = Query(None),
    end_date: date = Query(None)
):
    query = db.query(SalesTransaction).filter(
        SalesTransaction.user_id == current_user.id)

    if start_date:
        query = query.filter(
            func.date(SalesTransaction.timestamp) >= start_date)
    if end_date:
        query = query.filter(func.date(SalesTransaction.timestamp) <= end_date)

    transactions = query.all()

    # Calculate revenue
    total_revenue = sum(t.total_amount for t in transactions)

    # Format chart data so the frontend can actually display the trend
    # This groups sales by date
    trend_data = db.query(
        func.date(SalesTransaction.timestamp).label("date"),
        func.sum(SalesTransaction.total_amount).label("sales")
    ).filter(SalesTransaction.user_id == current_user.id)

    if start_date:
        trend_data = trend_data.filter(
            func.date(SalesTransaction.timestamp) >= start_date)
    if end_date:
        trend_data = trend_data.filter(
            func.date(SalesTransaction.timestamp) <= end_date)

    chart_results = trend_data.group_by(
        func.date(SalesTransaction.timestamp)).all()

    return {
        "revenue": total_revenue,  # Changed from total_revenue to revenue
        "transaction_count": len(transactions),  # Changed from count
        "chart_data": [{"date": str(r.date), "sales": float(r.sales)} for r in chart_results],
        "records": transactions
    }


@router.get("/admin/overview")
def get_admin_overview(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    user_id: int = Query(None),
    start_date: date = Query(None),
    end_date: date = Query(None)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    tx_query = db.query(SalesTransaction)
    if user_id:
        tx_query = tx_query.filter(SalesTransaction.user_id == user_id)
    if start_date:
        tx_query = tx_query.filter(
            func.date(SalesTransaction.timestamp) >= start_date)
    if end_date:
        tx_query = tx_query.filter(
            func.date(SalesTransaction.timestamp) <= end_date)

    transactions = tx_query.all()
    tx_ids = [t.id for t in transactions]

    if not tx_ids:
        return {"revenue": 0, "profit": 0, "transaction_count": 0, "chart_data": [], "pie_data": []}

    # 1. Financial Totals
    profit_stats = db.query(
        func.sum(SaleItem.subtotal).label("revenue"),
        func.sum((SaleItem.unit_price - Drug.buying_price)
                 * SaleItem.quantity).label("profit")
    ).join(Drug, SaleItem.drug_id == Drug.id)\
     .filter(SaleItem.transaction_id.in_(tx_ids)).first()

    # 2. Line Chart: Revenue Trend
    trend_data = db.query(
        func.date(SalesTransaction.timestamp).label("date"),
        func.sum(SalesTransaction.total_amount).label("sales")
    ).filter(SalesTransaction.id.in_(tx_ids))\
     .group_by(func.date(SalesTransaction.timestamp))\
     .order_by(func.date(SalesTransaction.timestamp)).all()

    # 3. Pie Chart: Profit by Product (Top 5)
    # This helps see which brands are actually making money
    pie_data = db.query(
        Product.brand_name.label("name"),
        func.sum((SaleItem.unit_price - Drug.buying_price)
                 * SaleItem.quantity).label("value")
    ).join(Drug, SaleItem.drug_id == Drug.id)\
     .join(Product, Drug.product_id == Product.id)\
     .filter(SaleItem.transaction_id.in_(tx_ids))\
     .group_by(Product.brand_name)\
     .order_by(func.sum((SaleItem.unit_price - Drug.buying_price) * SaleItem.quantity).desc())\
     .limit(5).all()

    return {
        "revenue": profit_stats.revenue or 0,
        "profit": profit_stats.profit or 0,
        "transaction_count": len(transactions),
        "chart_data": [{"date": str(d.date), "sales": d.sales} for d in trend_data],
        "pie_data": [{"name": p.name, "value": p.value} for p in pie_data]
    }

'''
@router.get("/export-report")
def export_sales_report(
    format: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    user_id: int = Query(None),
    start_date: date = Query(None),
    end_date: date = Query(None)
):
    # 1. Permission Check
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can export reports.")

    try:
        # 2. Query Setup - Using 'patient_name' as per your model
        query = db.query(
            SalesTransaction.timestamp,
            SalesTransaction.receipt_number,
            SalesTransaction.patient_name,
            SalesTransaction.total_amount,
            User.username.label("sold_by")
        ).join(User, SalesTransaction.user_id == User.id)

        # 3. Apply Filters
        if user_id:
            query = query.filter(SalesTransaction.user_id == user_id)
        if start_date:
            query = query.filter(
                func.date(SalesTransaction.timestamp) >= start_date)
        if end_date:
            query = query.filter(
                func.date(SalesTransaction.timestamp) <= end_date)

        results = query.order_by(SalesTransaction.timestamp.desc()).all()

        # 4. Data Preparation (Matching your Model Attributes)
        report_data = []
        for r in results:
            report_data.append({
                "Date": r.timestamp.strftime("%Y-%m-%d %H:%M") if r.timestamp else "N/A",
                "Receipt #": r.receipt_number,
                "Patient/Client": r.patient_name if r.patient_name else "Walk-in",
                "Amount (KES)": float(r.total_amount),
                "Staff Member": r.sold_by
            })

        # 5. Handle empty results to prevent library crashes
        if not report_data:
            report_data = [{"Status": "No data found for selected filters"}]

        # 6. Generate Response
        if format == "excel":
            file_out = generate_excel_report(report_data)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"Sales_Report_{date.today()}.xlsx"
        else:
            title = f"Pharmacy Sales Report: {start_date} to {end_date}"
            file_out = generate_pdf_report(report_data, title=title)
            media_type = "application/pdf"
            filename = f"Sales_Report_{date.today()}.pdf"

        return StreamingResponse(
            file_out,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        # This will now print the specific error in your server terminal
        print(f"--- EXPORT ERROR LOG ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal server error during report generation.")
            
'''


@router.get("/export-report")
def export_sales_report(
    format: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    user_id: int = Query(None),
    start_date: date = Query(None),
    end_date: date = Query(None)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Deep eager loading to prevent "DetachedInstanceError" (500 error)
        query = db.query(SalesTransaction).options(
            joinedload(SalesTransaction.user),
            joinedload(SalesTransaction.items)
            .joinedload(SaleItem.drug)
            .joinedload(Drug.product)
        )

        if user_id:
            query = query.filter(SalesTransaction.user_id == user_id)
        if start_date:
            query = query.filter(
                func.date(SalesTransaction.timestamp) >= start_date)
        if end_date:
            query = query.filter(
                func.date(SalesTransaction.timestamp) <= end_date)

        transactions = query.order_by(SalesTransaction.timestamp.desc()).all()

        report_data = []
        g_revenue = 0.0
        g_profit = 0.0

        for tx in transactions:
            tx_rev = float(tx.total_amount or 0)
            tx_prof = 0.0

            for item in tx.items:
                # Profit = (Selling Price - Buying Price) * Quantity
                # We use getattr to safely handle deleted products or missing batches
                buy_price = 0.0
                if item.drug:
                    buy_price = float(item.drug.buying_price or 0)

                tx_prof += (float(item.unit_price) - buy_price) * item.quantity

            g_revenue += tx_rev
            g_profit += tx_prof

            report_data.append({
                "Date": tx.timestamp.strftime("%Y-%m-%d %H:%M"),
                "Receipt #": tx.receipt_number,
                "Patient": tx.patient_name or "Walk-in",
                "Staff": tx.user.username if tx.user else "System",
                "Revenue": round(tx_rev, 2),
                "Profit": round(tx_prof, 2)
            })

        # Add Summary Totals Row
        if report_data:
            report_data.append({
                "Date": "TOTALS",
                "Receipt #": f"{len(transactions)} Sales",
                "Patient": "-",
                "Staff": "-",
                "Revenue": round(g_revenue, 2),
                "Profit": round(g_profit, 2)
            })
        else:
            report_data = [{"Message": "No data found"}]

        # Response handling
        if format == "excel":
            file_out = generate_excel_report(report_data)
            m_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ext = "xlsx"
        else:
            file_out = generate_pdf_report(
                report_data, title="Pharmacy Sales & Profit Report")
            m_type = "application/pdf"
            ext = "pdf"

        return StreamingResponse(
            file_out,
            media_type=m_type,
            headers={
                "Content-Disposition": f"attachment; filename=Report_{date.today()}.{ext}"}
        )

    except Exception as e:
        print(f"EXPORT CRASH: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail="Check server logs for relationship errors.")
