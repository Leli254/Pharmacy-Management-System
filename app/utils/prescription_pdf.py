# app/utils/prescription_pdf.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io


def generate_prescription_book_pdf(data, start_date, end_date):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    styles = getSampleStyleSheet()

    # Title
    elements.append(
        Paragraph("PRESCRIPTION REGISTER (TREATMENT RECORD BOOK)", styles['Title']))
    date_range = f"Period: {start_date} to {end_date}" if start_date else "Full Clinical History"
    elements.append(Paragraph(date_range, styles['Normal']))
    elements.append(Spacer(1, 12))

    # Table Header
    header = ['Date', 'Receipt', 'Patient',
              'Prescriber', 'Medicines', 'Instructions']
    table_data = [header]

    for item in data:
        table_data.append([
            item['date'],
            item['receipt_number'],
            f"{item['patient_name']}\n({item['age_sex']})",
            item['prescriber'],
            Paragraph(item['drugs'], styles['Normal']),
            Paragraph(item['instructions'], styles['Normal'])
        ])

    # Column widths for landscape A4
    table = Table(table_data, colWidths=[70, 80, 120, 130, 150, 180])

    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer
