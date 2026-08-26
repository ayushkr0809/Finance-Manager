# 💰 Finance Manager

A full-stack personal finance management application built with **FastAPI, PostgreSQL, React, and JWT authentication**.

Finance Manager lets users securely track income and expenses, manage budgets and recurring transactions, set savings goals, analyze spending patterns, and export financial data through a modern web dashboard.

This project is the web-based evolution of my original Python CLI Finance Manager.

---

## ✨ Features

### 🔐 Authentication & Security

* User registration and login
* JWT-based authentication
* Password hashing with **bcrypt**
* Master PIN-based data protection
* **Argon2id** key derivation
* **Fernet** encryption for sensitive financial data
* Protected API routes
* Secure account deletion with password + Master PIN confirmation

### 💰 Finance Management

* Add, edit, and delete income
* Add, edit, and delete expenses
* Predefined expense categories
* Search and filter transactions
* Sort transactions by date, category, and amount
* Track recurring expenses
* Manage monthly budgets
* Budget usage alerts
* Savings goals with progress tracking

### 📊 Reports & Analytics

* Dashboard overview
* Recent financial activity
* Monthly reports
* Yearly reports
* Expense category breakdown
* Average daily spending
* Top spending category
* 30-day expense trends
* 90-day running balance chart
* Interactive charts using Recharts

### 📥 Import & Export

* Export financial data to CSV
* Export reports to PDF
* Import transactions from CSV
* In-memory file generation and streaming

### 💱 Currency Settings

* Select a preferred display currency
* Currency preference is saved per account
* Currency changes are reflected throughout the application
* Changing the currency only changes the display — stored financial values are not converted

### 🎨 User Interface

* Modern responsive-inspired dashboard
* Sidebar navigation
* Dashboard overview
* Interactive charts
* Custom confirmation dialogs
* Hover and transition animations
* Two-panel authentication interface
* Consistent currency formatting
* Desktop-first layout

---

## 🛠️ Tech Stack

### Backend

* **Python**
* **FastAPI**
* **PostgreSQL**
* **SQLAlchemy**
* **Pydantic**
* **psycopg**
* **JWT**
* **bcrypt**
* **Argon2id**
* **Fernet**
* **python-dotenv**

### Frontend

* **React**
* **Vite**
* **JavaScript / JSX**
* **Recharts**
* **Lucide React**
* **CSS**

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │      Vite / JSX     │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Backend  │
                    │                     │
                    │ Authentication      │
                    │ Routers             │
                    │ Services            │
                    │ Security            │
                    └──────────┬──────────┘
                               │
                               │ SQLAlchemy
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │      Database       │
                    └─────────────────────┘
```

---

## 📁 Project Structure

```text
Finance-Manager/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── auth.py
│   ├── dependencies.py
│   │
│   ├── transaction_service.py
│   ├── budget_service.py
│   │
│   ├── routers/
│   │   ├── auth_router.py
│   │   ├── income_router.py
│   │   ├── expense_router.py
│   │   ├── budget_router.py
│   │   ├── recurring_router.py
│   │   ├── search_router.py
│   │   ├── reports_router.py
│   │   └── export_router.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── api.js
│   │   ├── utils.js
│   │   ├── constants.js
│   │   └── ...
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# 🔒 Security Design

Finance Manager uses multiple layers of protection for user authentication and financial data.

### Passwords

User passwords are hashed using **bcrypt** rather than being stored as plaintext.

### Master PIN

The Master PIN is used to derive an encryption key using **Argon2id**.

The derived key is then used with **Fernet** to protect sensitive financial information.

### JWT Authentication

After successful authentication, the application issues a JWT used to authorize subsequent API requests.

The current implementation uses a **60-minute token lifetime**.

> A production deployment should use HTTPS, secure token storage, appropriate token rotation/revocation strategies, and additional hardening.

### Important Design Tradeoff

The derived Fernet key is carried within the authenticated JWT so that the stateless web application can decrypt protected data on subsequent requests.

This means that possession of a valid token also provides the ability to decrypt the protected financial data during the token's lifetime.

This is a deliberate architectural tradeoff in the current implementation and would require additional security considerations for a production deployment.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

* Python 3.10+
* Node.js
* npm
* PostgreSQL
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/ayushkr0809/Finance-Manager.git
cd Finance-Manager
```

---

# ⚙️ Backend Setup

## 2. Create a Virtual Environment

### Windows

```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

You can use `.env.example` as a template.

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_manager
SECRET_KEY=your_secret_key
```

### Generate a Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the generated value into `SECRET_KEY`.

> Never commit your `.env` file to GitHub.

---

## 5. Create the PostgreSQL Database

Create an empty PostgreSQL database with the same name as `DB_NAME`.

For example:

```text
finance_manager
```

The application creates the required tables automatically.

> The application creates tables, but it does not create the PostgreSQL database itself.

---

## 6. Start the Backend

From the `backend` directory:

```bash
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

Open a second terminal.

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🗄️ Database Updates

The project currently uses SQLAlchemy's:

```python
Base.metadata.create_all()
```

This creates missing tables but does **not** modify existing tables when new columns are added.

For an existing database, newly introduced columns may need to be added manually.

For example:

```sql
ALTER TABLE users
ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
```

and:

```sql
ALTER TABLE users
ADD COLUMN created_at DATE DEFAULT CURRENT_DATE;
```

> **Planned improvement:** replace manual schema changes with Alembic migrations.

---

# 📊 Main Application Modules

| Module        | Description                             |
| ------------- | --------------------------------------- |
| Overview      | Financial summary and recent activity   |
| Income        | Manage income transactions              |
| Expenses      | Track and categorize expenses           |
| Budgets       | Set limits and monitor spending         |
| Recurring     | Manage recurring expenses               |
| Savings Goals | Set and track savings targets           |
| Search        | Find and filter transactions            |
| Reports       | Analyze financial activity              |
| Export        | Export financial data                   |
| Settings      | Manage account and currency preferences |

---

# 🔄 From CLI to Web Application

This project originally started as a Python CLI finance manager.

The web version expands the original functionality into a full-stack application.

### Database

```text
CLI:
MySQL

Web:
PostgreSQL + SQLAlchemy
```

### Interface

```text
CLI:
Terminal-based interaction

Web:
React + Vite dashboard
```

### Reports

```text
CLI:
Generated files / terminal output

Web:
Interactive React charts
```

### Exports

```text
CLI:
Files written to disk

Web:
In-memory generation + streamed downloads
```

### Recurring Transactions

Recurring expenses are processed automatically when a recurring template is created.

---

# 🧪 API

The backend exposes REST endpoints for:

```text
/auth
/income
/expense
/budget
/recurring
/search
/reports
/export
```

FastAPI's Swagger UI can be used to explore and test the endpoints:

```text
http://127.0.0.1:8000/docs
```

---

# 📸 Screenshots

> Screenshots can be added here to showcase the application interface.

### Login

*Add screenshot here*

### Dashboard

*Add screenshot here*

### Reports

*Add screenshot here*

### Budget Management

*Add screenshot here*

---

# 🔮 Future Improvements

The following improvements are planned:

* [ ] Alembic database migrations
* [ ] Pagination for large transaction lists
* [ ] Full mobile/responsive dashboard
* [ ] Improved token management
* [ ] Forgot Master PIN recovery strategy
* [ ] More advanced financial analytics
* [ ] Improved budget confirmation workflow
* [ ] Production deployment
* [ ] Automated testing
* [ ] CI/CD pipeline

---

# 🎯 Project Goals

The main goals of this project were to:

* Build a complete full-stack application
* Move from CLI-based software to a web architecture
* Learn REST API development with FastAPI
* Work with PostgreSQL and SQLAlchemy
* Implement JWT authentication
* Explore password hashing and encryption
* Build a modern React dashboard
* Connect frontend and backend systems
* Work with real-world financial data flows
* Practice designing and structuring a larger application

---

# 👨‍💻 Author

**Ayush Kumar**

B.Tech Computer Science & Engineering

GitHub:
https://github.com/ayushkr0809

---

# 📄 License

This project is available for educational and personal use.

See the repository license for details.
