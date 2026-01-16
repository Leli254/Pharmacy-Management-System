# app/database/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
# optional, but good for Docker + long-running apps
from sqlalchemy.pool import NullPool

# Connection string for Postgres running in Docker Compose
# - Host: 'db' (service name in docker-compose.yml)
# - Database: pharmacy
# - User/Password: postgres/postgres (as set in your docker-compose)
DATABASE_URL = "postgresql+psycopg2://postgres:postgres@db:5432/pharmacy"

# Alternative: use environment variables (recommended for security/flexibility)
# import os
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@db:5432/pharmacy")

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,           # Prevents connection pooling issues in some Docker setups
    # echo=True                   # Uncomment during debugging to see SQL queries
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency to provide a database session.
    Automatically closes the session after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
