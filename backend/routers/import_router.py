import io

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Transaction
from schemas import ImportResult
from security import encrypt_value

router = APIRouter(prefix="/import", tags=["import"])

REQUIRED_COLUMNS = {"Date", "Type", "Category", "Amount"}


@router.post("/csv", response_model=ImportResult)
async def import_csv(
    file: UploadFile = File(...),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    """Expects the same columns export_csv produces: Date, Type, Category,
    Amount, Notes. Bad rows are skipped rather than failing the whole
    import — you get a count of both back."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Couldn't read that file as CSV")

    if not REQUIRED_COLUMNS.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must include columns: {', '.join(sorted(REQUIRED_COLUMNS))}",
        )

    imported = 0
    skipped = 0

    for _, row in df.iterrows():
        try:
            txn_type = str(row["Type"]).strip().lower()
            if txn_type not in ("income", "expense"):
                skipped += 1
                continue

            amount = float(row["Amount"])  # validates it's a real number
            notes = row.get("Notes", "")
            notes = "" if pd.isna(notes) else str(notes)

            db.add(
                Transaction(
                    user_id=vault.user.id,
                    type=txn_type,
                    category=str(row["Category"]).strip(),
                    date=pd.to_datetime(row["Date"]).date(),
                    encrypted_amount=encrypt_value(vault.fernet, str(amount)),
                    encrypted_notes=encrypt_value(vault.fernet, notes),
                )
            )
            imported += 1
        except Exception:
            skipped += 1

    db.commit()
    return {"imported": imported, "skipped": skipped}
