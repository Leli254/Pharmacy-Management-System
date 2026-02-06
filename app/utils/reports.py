# app/utils/reports.py
import io
import pandas as pd
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet


def generate_excel_report(data):
    output = io.BytesIO()
    df = pd.DataFrame(data)
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sales Report')
        ws = writer.sheets['Sales Report']
        for idx, col in enumerate(df.columns):
            max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
            ws.column_dimensions[chr(65 + idx)].width = max_len
    output.seek(0)
    return output


def generate_pdf_report(data, title="Sales Report"):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=landscape(letter),
                            rightMargin=20, leftMargin=20, topMargin=30, bottomMargin=20)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(title, styles['Title']))
    elements.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 15))

    if data:
        cols = list(data[0].keys())
        table_data = [cols] + [[str(row[c]) for c in cols] for row in data]

        # Column Widths: Date, Receipt, Patient, Staff, Revenue, Profit
        widths = [110, 90, 160, 100, 90, 90]
        t = Table(table_data, colWidths=widths)

        style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (3, -1), 'LEFT'),   # Text columns
            ('ALIGN', (4, 0), (5, -1), 'RIGHT'),  # Money columns
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.whitesmoke, colors.white]),
        ]

        if data[-1].get("Date") == "TOTALS":
            style.extend([
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#edf2f7')),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('LINEABOVE', (0, -1), (-1, -1), 1.5, colors.black),
            ])

        t.setStyle(TableStyle(style))
        elements.append(t)

    doc.build(elements)
    output.seek(0)
    return output
