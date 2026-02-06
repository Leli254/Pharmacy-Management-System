# Pharmacy Inventory Tracker

A modern, offline-first pharmacy inventory management system built with **FastAPI**, **PostgreSQL**, and **React (Vite)**.  
Designed for pharmacies, with a focus on reliability, performance, and ease of use.

---

## ✨ Features

- 🔐 Secure authentication (JWT-based)
- 📦 Stock and inventory tracking
- 🚨 Low-stock alerts
- 🧾 Audit logging
- 📴 Offline-first friendly architecture
- ⚡ FastAPI backend with PostgreSQL
- 🎨 React (Vite) frontend
- 🐳 Fully Dockerized (local & production ready)

---

## 🧱 Tech Stack

### Backend
- **FastAPI**
- **SQLAlchemy**
- **PostgreSQL**
- **JWT Authentication**
- **Uvicorn**

### Frontend
- **React**
- **Vite**
- **React Router**

### Infrastructure
- **Docker**
- **Docker Compose**

---

## 📁 Project Structure

```text
PharmacyTracker/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── codeql.yml
│
├── app/
│   ├── database/
│   │   └── db.py                 # Database engine, session, Base
│   │
│   ├── dependencies/
│   │   └── auth.py               # JWT auth dependencies
|   ├── core/
|   |   └── config.py             # Settings / config
│   │
│   ├── models/
│   │   ├── dda.py                # DDA / controlled drugs models
│   │   ├── sales.py              # Sales and checkout models
│   │   ├── stock.py              # Drugs, batches, inventory models
│   │   ├── stock_movement.py     # Stock movement / audit trail
│   │   └── user.py               # User and role models
│   │
│   ├── routers/
│   │   ├── admin_router.py       # Admin tools (DB dump / maintenance)
│   │   ├── alerts_router.py      # Low stock, expiry, DDA alerts
│   │   ├── audit_router.py       # Stock movement & audit history
│   │   ├── auth_router.py        # Authentication & authorization
│   │   ├── sales_router.py       # Sales & dispensing endpoints
│   │   └── stock_router.py       # Stock & batch management
│   │
│   ├── schemas/
│   │   └── user.py               # Pydantic schemas
│   │
│   ├── utils/
│   │   ├── dda_pdf.py            # DDA register PDF generation
│   │   ├── jwt.py                # JWT creation & verification
│   │   ├── prescription_pdf.py  # Prescription book PDF
│   │   ├── receipt_pdf.py        # Sales receipt generation
│   │   ├── reports.py            # Sales reports (PDF / Excel)
│   │   └── security.py           # Password hashing & verification
│   │
│   └── main.py                   # FastAPI application entry point
│
├── backups/                       # PostgreSQL database backups
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Footer.jsx
│   │   ├── Pages/                # All application pages
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js
│
├── docker-compose.yml             # Full stack orchestration
├── Dockerfile                     # Backend container
├── requirements.txt               # Python dependencies
│
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── SECURITY.md


```
---

### 🚀 Getting Started
###### Prerequisites

- Docker

- Docker Compose

No local Python or Node installations are required.

---

## 🔧 Environment Variables

Create a ```.env``` file in the project root:

```code
POSTGRES_DB=pharmacy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@pharmacy-db:5432/pharmacy
SECRET_KEY=change-this-secret
```

> ⚠️ Never commit .env files to GitHub.

---

## 🐳 Running the Project (Recommended)

```docker compose up --build```

#### Services
Service	URL
Frontend	http://localhost:5173

Backend API	http://localhost:8000

API Docs (Swagger)	http://localhost:8000/docs

Health Check	http://localhost:8000/health

---

### 🔐 Authentication Flow

**Signup**

```POST /auth/signup```

**Login**

```POST /auth/login```


**Returns:**

```
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

Include the token in requests:

```Authorization: Bearer <token>```

---

## 🗄 Database & Migrations

- Tables are created automatically on startup using:

```Base.metadata.create_all(bind=engine)```


- No manual migrations are required during early development.

> For production or schema evolution, Alembic is recommended.

### 🧪 Development Notes

- Virtual environments (```venv```, ```lib/```, ```lib64/```) are not committed

- Databases (```*.db```) are ignored

- Secrets are never stored in Git

---

## 📦 Deployment

This project is deployment-ready for:

- VPS

- Docker-based hosting

- AWS / GCP / DigitalOcean or cloud of your choice

Recommended:

- Nginx as a reverse proxy

- HTTPS via Let’s Encrypt

- Environment-specific .env files

---

## Dependency Management

We use **Dependabot** to keep dependencies up-to-date:

- Python (pip): weekly updates
- npm (frontend): weekly updates with grouped minor/patch PRs
- Docker & GitHub Actions: monthly updates

---

## 🤝 Contributing

1. Fork the repository

2. Create a feature branch

3. Commit clean, logical changes

4. Open a Pull 

---

### 📄 License

MIT License

---

### 👤 Author

**Michael Leli**
Backend Engineer | Python | FastAPI | Systems Design

---

### ✅ Status

> 🚧 Active Development
> Core authentication and inventory features are stable.
