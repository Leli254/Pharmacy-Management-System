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
