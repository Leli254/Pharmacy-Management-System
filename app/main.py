from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import engine, Base
from app.routers import (
    auth_router,
    stock_router,
    alerts_router,
    audit_router,
)

# -------------------------
# Lifespan (startup / shutdown)
# -------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup (optional)


# -------------------------
# Initialize FastAPI app
# -------------------------
app = FastAPI(
    title="Pharmacy Inventory Tracker",
    description="Offline-first inventory tracker for Kenyan pharmacies",
    version="1.0.0",
    lifespan=lifespan,
)

# -------------------------
# CORS Middleware
# -------------------------
origins = [
    "http://localhost:5173",
    "http://frontend:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Health check
# -------------------------


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# -------------------------
# Include API routers (all prefixed with /api)
# -------------------------
app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(stock_router.router, prefix="/api/stock", tags=["Stock"])
app.include_router(alerts_router.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(audit_router.router, prefix="/api/audit", tags=["Audit"])
