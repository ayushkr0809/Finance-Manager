from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Category
from schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    return db.execute(
        select(Category).where(Category.user_id == vault.user.id).order_by(Category.name)
    ).scalars().all()


@router.post("", response_model=CategoryOut, status_code=201)
def add_category(
    data: CategoryCreate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name can't be empty")

    # Case-insensitive match so "Food" and "food" collapse into one entry —
    # this is the actual fix for the pie chart fragmenting by casing.
    existing = db.execute(
        select(Category).where(Category.user_id == vault.user.id, Category.name.ilike(name))
    ).scalars().first()
    if existing:
        return existing

    category = Category(user_id=vault.user.id, name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    category = db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == vault.user.id)
    ).scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
