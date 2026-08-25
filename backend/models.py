from datetime import date as date_type
from sqlalchemy import String, Float, Date, LargeBinary, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    master_salt: Mapped[bytes] = mapped_column(LargeBinary)
    currency: Mapped[str] = mapped_column(String(3), default="INR", server_default="INR")
    created_at: Mapped[date_type] = mapped_column(Date, default=date_type.today)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(10))  # "income" | "expense"
    category: Mapped[str] = mapped_column(String(50))
    date: Mapped[date_type] = mapped_column(Date)
    encrypted_amount: Mapped[bytes] = mapped_column(LargeBinary)
    encrypted_notes: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(50))
    frequency: Mapped[str] = mapped_column(String(20))
    encrypted_amount: Mapped[bytes] = mapped_column(LargeBinary)
    encrypted_notes: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    last_processed_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(50))  # "Overall" or specific category
    monthly_limit: Mapped[float] = mapped_column(Float)


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(100))
    target_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    encrypted_target_amount: Mapped[bytes] = mapped_column(LargeBinary)
    encrypted_current_amount: Mapped[bytes] = mapped_column(LargeBinary)
