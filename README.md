# Finance Manager

A personal finance tracker with a twist: every amount and note is encrypted
with a key derived from a Master PIN that's never stored anywhere — not even
the server can read your numbers without it.

Originally a Python CLI tool, rebuilt as a full web app: **FastAPI + PostgreSQL**
on the backend, **React (Vite)** on the frontend, JWT-based auth.

---

## Features

**Accounts & security**
- Two separate secrets: a login password (bcrypt) and a Master PIN that
  derives your encryption key (Argon2id) — see [Security model](#security-model) below
- JWT-based sessions
- Change display currency, or permanently delete your account and all its data

**Money tracking**
- Income and expense entries with predefined expense categories
- Recurring expenses that auto-add themselves daily, catching up on missed days
- Monthly budgets per category (or overall), with in-app alerts when you're close to or over

**Reports**
- Trends view: 90-day running balance, 30-day daily spend, 6-month income vs. expense
- Monthly and yearly breakdowns with category charts
- Search by category, date, or exact amount

**Data**
- Export to CSV or PDF
- Import from CSV (same format the export produces)
- Savings goals with progress tracking

---

## Security model

Your login password only proves it's you — it never touches your data.

Your **Master PIN** is never stored. At registration, a random salt is saved
for your account. Every time you log in, the PIN + that salt run through
**Argon2id** to deterministically re-derive the same 32-byte key, which
becomes a **Fernet** symmetric key. Every amount and note is encrypted with
that key before it touches the database — the database only ever sees
ciphertext.

Since there's no server-side session store, the derived key rides inside
your **JWT**, issued at login and required on every request. This means
anyone holding a valid token can decrypt your data for its lifetime — the
same trust model as any bearer-token API, which is why tokens are short-lived
and the app should always be served over HTTPS in production.

---

## Tech stack

| | |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Auth | JWT (`python-jose`), bcrypt, Argon2id (`argon2-cffi`) |
| Encryption | Fernet (`cryptography`) |
| Frontend | React 18 (Vite), Recharts, Lucide icons |
| Exports | pandas (CSV), fpdf2 (PDF) |

---

## Project structure

```
finance-webapp/
├── backend/
│   ├── main.py               # FastAPI app, router registration, CORS
│   ├── database.py           # engine, session, Base
│   ├── models.py             # User, Transaction, RecurringExpense, Budget, Goal
│   ├── schemas.py            # Pydantic request/response models
│   ├── security.py           # hashing, key derivation, encrypt/decrypt
│   ├── auth.py                # JWT create/decode
│   ├── dependencies.py       # get_current_vault — user + unlocked Fernet key
│   ├── transaction_service.py
│   ├── budget_service.py
│   └── routers/
│       ├── auth_router.py
│       ├── income_router.py
│       ├── expense_router.py
│       ├── budget_router.py
│       ├── recurring_router.py
│       ├── search_router.py
│       ├── reports_router.py
│       ├── export_router.py
│       ├── import_router.py
│       └── goals_router.py
└── frontend/
    └── src/
        ├── App.jsx / Login.jsx / Register.jsx / Dashboard.jsx
        ├── api.js                # every backend call
        ├── CurrencyContext.jsx   # display-currency state, shared app-wide
        ├── theme.css / AuthPage.css
        └── components/           # one file per feature section
```

---

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL, running locally or reachable

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
```

Open `.env` and fill in your real Postgres credentials. Then generate a real
JWT secret and paste it in as `JWT_SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Create an empty database in Postgres matching `DB_NAME` in your `.env` —
the app creates all the tables inside it automatically on first run.

```bash
uvicorn main:app --reload
```

Visit `http://127.0.0.1:8000/docs` to confirm it's up — try `/auth/register`
there first (you'll need a username, password, **and** a Master PIN).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` and talks to the backend at
`http://localhost:8000` by default (see `API_BASE` in `src/api.js` if yours
runs elsewhere).

---

## Environment variables

| Variable | Description |
|---|---|
| `DB_USER` | Postgres username |
| `DB_PASSWORD` | Postgres password |
| `DB_HOST` | Usually `localhost` |
| `DB_PORT` | Usually `5432` |
| `DB_NAME` | Database name (must already exist, empty) |
| `JWT_SECRET_KEY` | Random secret for signing tokens — generate your own, never reuse the example |

`backend/.env` is gitignored on purpose. Only `backend/.env.example` (no real
secrets) is committed.

---

## Known limitations / possible next steps

- No database migrations yet (schema changes require a fresh database —
  fine for a solo project, would need Alembic for a team/production setting)
- No pagination — transaction lists load in full
- Desktop-first layout; the dashboard sidebar isn't responsive on small screens yet
- No password-reset flow

---

## License

MIT — see [LICENSE](./LICENSE).
