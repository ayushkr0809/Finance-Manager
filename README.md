# Finance Manager — Web Edition

Your CLI finance manager, rebuilt as FastAPI + Postgres + JWT on the
backend, React (Vite/JSX) on the frontend. Every module you had —
income, expense, budget, recurring, search, reports, export — is here,
same logic, same encryption model.

## Folder structure

```
finance-webapp/
├── backend/
│   ├── main.py               # wires up all routers + CORS
│   ├── database.py           # engine, session, Base
│   ├── models.py             # User, Transaction, RecurringExpense, Budget
│   ├── schemas.py            # all Pydantic input/output shapes
│   ├── security.py           # bcrypt, Argon2id key derivation, Fernet
│   ├── auth.py                # JWT create/decode
│   ├── dependencies.py       # get_current_vault (user + unlocked Fernet)
│   ├── transaction_service.py  # shared income/expense CRUD
│   ├── budget_service.py     # shared budget-alert logic
│   ├── routers/
│   │   ├── auth_router.py     # /auth/register, /auth/login
│   │   ├── income_router.py
│   │   ├── expense_router.py
│   │   ├── budget_router.py
│   │   ├── recurring_router.py
│   │   ├── search_router.py
│   │   ├── reports_router.py
│   │   └── export_router.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── Login.jsx / Register.jsx
    │   ├── Dashboard.jsx        # sidebar + section switcher
    │   ├── components/          # one file per module
    │   ├── api.js                # every backend call
    │   └── theme.css / AuthPage.css
    ├── index.html, package.json, vite.config.js
```

## ⚠️ Second manual step required
Same issue as the `currency` column — a `created_at` column was added to
`users` (tracks when the account was made), used to cap the Monthly/Yearly
year dropdowns to a range that starts at account creation instead of an
arbitrary "last 5 years." Run this too:

```sql
ALTER TABLE users ADD COLUMN created_at DATE DEFAULT CURRENT_DATE;
```

## Fixes & currency setting (latest round)

- **Recurring expenses process immediately on add** — previously, adding a
  new template only synced on next login; now `processRecurring()` runs
  right after the template is created, so today's entry shows up without
  waiting.
- **Sidebar no longer drifts** — the real bug was that `.sidebar` had no
  fixed height, so it stretched to match whichever section's content was
  tallest, making the logout button land in a different spot per page.
  Fixed with `position: sticky` + `height: 100vh` on the sidebar and
  independent scrolling on `.main-content`.
- **Currency setting** — Settings now has a dropdown (₹, $, €, £, ¥, A$, C$).
  Changing it updates every amount across the app immediately, via a new
  `CurrencyContext` that all components read `formatMoney` from instead of
  a hardcoded formatter. The choice is saved per-account
  (`PATCH /auth/currency`) so it persists across logins — it's a display
  preference only, not currency conversion; stored numbers don't change.

### ⚠️ One-time manual step required
The `currency` column is new on the `users` table. Since this project
doesn't have Alembic migrations yet, `Base.metadata.create_all()` only
creates *missing tables* — it won't alter a table that already exists in
your database. Before starting the backend, run this once in pgAdmin or
psql:

```sql
ALTER TABLE users ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
```

If you'd rather not run raw SQL, dropping and recreating the `users`
table (and re-registering) works too, since `create_all()` will build it
fresh with the new column — but that means losing existing accounts.

## v2 — real features, real dashboard

- **Savings Goals** — new tab. Set a target amount (and optional target
  date), contribute toward it over time, watch a progress bar fill in.
  Amounts are encrypted the same way transactions are.
- **Budget alerts on Overview** — any budget over its limit or past 80%
  now shows as a banner the moment you land on the dashboard, not just
  when you're mid-way through adding an expense.
- **Quick stats on Overview** — average daily spend and top spending
  category, computed from data you already have loaded, no extra
  backend calls.
- **Running balance chart** — a 90-day cumulative area chart in
  Reports → Trends (`GET /reports/balance-trend`), so you can see the
  actual trend line instead of only period snapshots.
- **CSV import** — the missing half of export. Upload a CSV with
  `Date, Type, Category, Amount, Notes` columns (same shape the export
  produces) and it gets parsed and added; bad rows are skipped, not
  fatal to the whole import.
- **Sortable, filterable transaction tables** — click a column header
  to sort by date/category/amount; filter by category when more than
  one is present. All client-side, no new backend calls.
- **Real confirm dialogs** — `ConfirmDialog.jsx` replaces the browser's
  native `confirm()` for every delete action across Income, Expense,
  Recurring, and Goals.
- **Visual pass** — a genuine two-panel login/register screen instead
  of a plain centered card, sidebar icons throughout, a colored
  "ledger-tab" accent stripe on balance cards (the one deliberate
  signature element), a faint ledger-ruling texture on the main
  content area, and consistent motion (fade-ins, hover lifts) instead
  of a static-feeling dashboard.

### Still open for a "real" v1
- Pagination once transaction lists get long (currently loads everything)
- Alembic migrations instead of `create_all()`
- Full mobile/responsive layout (currently desktop-first; auth screen
  collapses to one panel under 860px, the dashboard sidebar doesn't yet)

## v1 finishing touches

- **Overview tab** — new default landing page: quick balance cards, a 30-day
  expense line, recent activity across income + expense, and quick-add
  buttons. Nothing new on the backend — it just combines existing endpoints.
- **Monthly & Yearly analysis** — new tabs inside Reports. Pick a month or
  year and get real totals, transaction count, and a category breakdown for
  exactly that period (`GET /reports/monthly?year=&month=`,
  `GET /reports/yearly?year=`). This is what the CLI's empty
  `MonthlyReport.py`/`YearlyReport.py` stubs were meant to become.
- **Predefined expense categories** — a fixed list (`constants.js`), not
  free text, so pie charts and budgets can't fragment on casing
  ("Food" vs "food"). Income stays free text, matching the original CLI.
- **Consistent currency formatting** — one `formatMoney()` helper
  (`utils.js`) used everywhere, instead of manually building `$` + `.toFixed(2)`
  strings in five different components.
- **Basic input validation** — amount must be a positive number before the
  form will submit, client-side.
- **Delete account** — a Settings tab with a danger zone: re-enter your
  password + Master PIN, type `DELETE` to confirm, and it wipes every
  transaction, budget, and recurring template before removing the account.
- **Sidebar icons + subtle motion** — `lucide-react` icons per nav item,
  and a small fade-in on panels/cards so the dashboard doesn't feel static.

### Other things worth doing before this is a "real" v1
- Pagination once transaction lists get long (currently loads everything)
- A proper confirm modal instead of the browser's native `confirm()` for deletes
- CSV import, not just export
- Alembic migrations instead of `create_all()`
- Basic mobile/responsive layout — currently optimized for desktop width

## What changed from the CLI, and why

**MySQL → Postgres.** Same schema, translated engine string, same as
your Careerverse setup.

**The Master PIN → vault key, inside the JWT.** In the CLI, you entered
the PIN once and the derived Fernet key just lived in memory for as
long as the program kept running. A web app has no equivalent
"keeps running" — every request is stateless. So the derived key now
travels inside the JWT payload itself: unlock once at login, and every
request after that carries proof you're still unlocked. This means
anyone holding a valid token can decrypt your data — same risk as any
bearer token in any app, which is why real deployments need HTTPS and
a short token lifetime (currently 60 minutes, in `auth.py`).

**PIN validation got stricter.** Argon2id can't tell you if a PIN was
*right* — it always produces *some* key. The original CLI's `except
Exception` around key derivation wouldn't actually catch a wrong PIN.
`auth_router.py` now tries decrypting one of your own real transactions
with the derived key at login — if that fails, the PIN was wrong.

**Pie chart → JSON + a real interactive chart.** The CLI saved a PNG
to disk (`expense_pie.png`). The backend now returns plain category
totals as JSON (`/reports/expense-by-category`), and the React
dashboard renders them with `recharts` — hoverable, no file to dig up.

**CSV/PDF exports → in-memory, streamed downloads.** The CLI wrote to
fixed filenames (`export.csv`, `report.pdf`) — fine for one user on one
machine, but on a shared server every user's export would overwrite
the same file. Exports are now built in memory per-request and
streamed straight back as a download.

**Empty stub modules left out.** `MonthlyReport.py`, `YearlyReport.py`,
`CategoryWiseSpending.py`, `BarChart.py`, and `MonthlyTrend.py` had no
code in your original project, so they weren't ported — everything
that had real logic was.

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# fill in your real Postgres credentials
# generate a real secret: python -c "import secrets; print(secrets.token_hex(32))"
```

Create an empty database in pgAdmin4 matching `DB_NAME` in your `.env`
— the code creates the tables, not the database itself.

```bash
uvicorn main:app --reload
```

Test in `http://127.0.0.1:8000/docs` first — register, then login
(you'll need username + password + Master PIN for both).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Next steps worth doing yourself

- Alembic migrations instead of `create_all()`
- A "forgot Master PIN" story (there isn't one here — same as your
  original, losing the PIN means losing access to old data, by design)
- Pagination once transaction lists get long
- Wrap the budget-alert warning into a proper confirm-before-save modal
  instead of a banner
