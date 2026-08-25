import io

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Transaction
from security import decrypt_value

router = APIRouter(prefix="/export", tags=["export"])

# NOTE: the original CLI wrote export.csv / report.pdf to a fixed filename on
# disk. In a multi-user web app that would mean every user's export
# overwrites the same file on the server — instead, each file is built
# in-memory and streamed straight back as a download, per request.


@router.get("/csv")
def export_csv(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    txns = db.execute(select(Transaction).where(Transaction.user_id == vault.user.id)).scalars().all()

    rows = [
        {
            "Date": str(t.date),
            "Type": t.type,
            "Category": t.category,
            "Amount": decrypt_value(vault.fernet, t.encrypted_amount),
            "Notes": decrypt_value(vault.fernet, t.encrypted_notes),
        }
        for t in txns
    ]

    buffer = io.StringIO()
    pd.DataFrame(rows).to_csv(buffer, index=False)
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=export.csv"},
    )


@router.get("/pdf")
def export_pdf(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    txns = db.execute(select(Transaction).where(Transaction.user_id == vault.user.id)).scalars().all()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Finance Report", ln=True, align="C")
    for t in txns:
        amount = decrypt_value(vault.fernet, t.encrypted_amount)
        pdf.cell(200, 10, txt=f"{t.date} | {t.type} | {t.category} | {vault.user.currency} {amount}", ln=True)

    pdf_bytes = bytes(pdf.output(dest="S"))

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )
