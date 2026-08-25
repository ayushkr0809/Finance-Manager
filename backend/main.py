from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from dependencies import CurrentVault, get_current_vault
from routers import (
    auth_router,
    budget_router,
    expense_router,
    export_router,
    goals_router,
    import_router,
    income_router,
    recurring_router,
    reports_router,
    search_router,
)

# Creates tables if they don't exist yet. Swap for Alembic migrations once
# the schema is stable — see your Careerverse roadmap for the same note.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(income_router.router)
app.include_router(expense_router.router)
app.include_router(budget_router.router)
app.include_router(recurring_router.router)
app.include_router(search_router.router)
app.include_router(reports_router.router)
app.include_router(export_router.router)
app.include_router(import_router.router)
app.include_router(goals_router.router)


@app.get("/me")
def read_current_user(vault: CurrentVault = Depends(get_current_vault)):
    return {
        "id": vault.user.id,
        "username": vault.user.username,
        "currency": vault.user.currency,
        "created_at": vault.user.created_at,
    }
