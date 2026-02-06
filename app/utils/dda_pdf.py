# app/utils/dda_pdf.py
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle



def generate_dda_pdf(data, start_date, end_date):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    styles = getSampleStyleSheet()

    # Header Section
    elements.append(
        Paragraph("DANGEROUS DRUGS REGISTER (DDA)", styles['Heading1']))
    date_text = f"Period: {start_date} to {end_date}" if start_date else "Complete Audit Trail"
    elements.append(Paragraph(date_text, styles['Normal']))
    elements.append(Spacer(1, 15))

    # Add Running Balance to the Header
    header = ["Date", "Medication", "Type",
              "Entity", "Ref", "Qty", "Balance", "User"]
    table_data = [header]

    for entry in data:
        table_data.append([
            entry["timestamp"][:10],
            f"{entry['brand_name']}\n({entry['batch_number']})",
            entry["entry_type"],
            entry["entity_name"],
            entry["ref_number"],
            str(entry["quantity"]),
            str(entry["running_balance"]),  # New Column
            entry["user_name"]
        ])

    # Table styling with specific widths for landscape
    t = Table(table_data, colWidths=[70, 140, 70, 140, 90, 40, 60, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(t)
    doc.build(elements)
    buffer.seek(0)
    return buffer
