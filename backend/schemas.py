from datetime import date as date_type
from typing import Literal, Optional

from pydantic import BaseModel


# ---- Auth ----
class RegisterIn(BaseModel):
    username: str
    password: str
    master_pin: str


class LoginIn(BaseModel):
    username: str
    password: str
    master_pin: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str


class AccountDeleteIn(BaseModel):
    password: str
    master_pin: str


class CurrencyUpdate(BaseModel):
    currency: str


# ---- Transactions (income + expense share this shape) ----
class TransactionCreate(BaseModel):
    amount: str  # kept as string, matching original CLI input -> encrypted as-is
    category: str
    date: date_type
    notes: Optional[str] = ""


class TransactionUpdate(BaseModel):
    amount: Optional[str] = None
    category: Optional[str] = None
    date: Optional[date_type] = None
    notes: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    type: str
    category: str
    date: date_type
    amount: str
    notes: str


# ---- Recurring ----
class RecurringCreate(BaseModel):
    category: str
    amount: str
    notes: Optional[str] = "Auto"
    frequency: Literal["daily"] = "daily"


class RecurringOut(BaseModel):
    id: int
    category: str
    amount: str
    notes: str
    frequency: str
    last_processed_date: Optional[date_type] = None


# ---- Budget ----
class BudgetSet(BaseModel):
    category: str  # "Overall" or a specific category
    monthly_limit: float


class BudgetOut(BaseModel):
    category: str
    monthly_limit: float
    spent: float
    remaining: float


# ---- Reports ----
class BalanceOut(BaseModel):
    income: float
    expense: float
    balance: float


class CategoryTotal(BaseModel):
    category: str
    total: float


class MonthlyTrendPoint(BaseModel):
    month: str  # "2026-08"
    income: float
    expense: float


class DailyExpensePoint(BaseModel):
    date: date_type
    total: float


class MonthPoint(BaseModel):
    month: int  # 1-12
    income: float
    expense: float


class MonthlySummaryOut(BaseModel):
    income: float
    expense: float
    balance: float
    transaction_count: int
    by_category: list[CategoryTotal]


class YearlySummaryOut(BaseModel):
    income: float
    expense: float
    balance: float
    monthly_breakdown: list[MonthPoint]
    by_category: list[CategoryTotal]


class BalanceTrendPoint(BaseModel):
    date: date_type
    balance: float


# ---- Goals ----
class GoalCreate(BaseModel):
    name: str
    target_amount: str
    target_date: Optional[date_type] = None


class GoalContribute(BaseModel):
    amount: str


class GoalOut(BaseModel):
    id: int
    name: str
    target_amount: str
    current_amount: str
    target_date: Optional[date_type] = None


# ---- Import ----
class ImportResult(BaseModel):
    imported: int
    skipped: int
