# app/utils/receipt_pdf.py
import io
from reportlab.lib.pagesizes import A6
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm


def generate_receipt_pdf(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A6, rightMargin=5*mm,
                            leftMargin=5*mm, topMargin=5*mm, bottomMargin=5*mm)
    elements = []
    styles = getSampleStyleSheet()

    # Define custom styles
    title_style = ParagraphStyle(
        'Title', parent=styles['Heading1'], fontSize=14, alignment=1, spaceAfter=10)
    normal_style = ParagraphStyle(
        'NormalSmall', parent=styles['Normal'], fontSize=8, spaceAfter=2)
    bold_style = ParagraphStyle(
        'BoldSmall', parent=styles['Normal'], fontSize=8, fontWeight='bold')

    # Header
    elements.append(Paragraph("<b>PHARMACY RECEIPT</b>", title_style))
    elements.append(Paragraph(f"Date: {data.get('date', '')}", normal_style))
    elements.append(
        Paragraph(f"Client: {data.get('client_name', 'Walk-in')}", normal_style))
    elements.append(
        Paragraph(f"Receipt No: {data.get('receipt_number', '')}", normal_style))
    elements.append(
        Paragraph(f"Ticket No: <b>{data.get('ticket_number', '')}</b>", normal_style))
    elements.append(Spacer(1, 3*mm))

    # Items Table
    table_header = [["Item", "Qty", "Price", "Total"]]
    table_rows = []
    for item in data.get('items', []):
        table_rows.append([
            item['name'][:18],
            str(item['qty']),
            f"{item['price']:,.2f}",
            f"{item['subtotal']:,.2f}"
        ])

    table = Table(table_header + table_rows,
                  colWidths=[35*mm, 10*mm, 20*mm, 20*mm])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(table)

    # Footer
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph(f"<b>GRAND TOTAL: KES {data.get('total_amount', 0):,.2f}</b>", ParagraphStyle(
        'Total', parent=styles['Normal'], fontSize=10, alignment=2)))
    elements.append(Spacer(1, 5*mm))
    elements.append(
        Paragraph(f"Served by: {data.get('served_by', 'Staff')}", normal_style))
    elements.append(Paragraph("<i>Thank you for your visit!</i>", ParagraphStyle(
        'Msg', parent=styles['Normal'], fontSize=8, alignment=1, spaceBefore=10)))

    doc.build(elements)
    buffer.seek(0)
    return buffer
