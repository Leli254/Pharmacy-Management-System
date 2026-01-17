# Pharmacy Inventory Tracker

A modern, offline-first pharmacy inventory management system built with **FastAPI**, **PostgreSQL**, and **React (Vite)**.  
Designed for small to medium pharmacies, with a focus on reliability, performance, and simplicity.

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
.
├── app/                    # FastAPI backend
│   ├── main.py
│   ├── database/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── utils/
│   └── dependencies/
│
├── frontend/               # React (Vite) frontend
│   ├── src/
│   ├── index.html
│   └── vite.config.js
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
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

### ✅ Status

> 🚧 Active Development
> Core authentication and inventory features are stable.
