import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.config.config import settings

logger = logging.getLogger("app.database")

# Declarative base for models
Base = declarative_base()

# Setup database engine (using synchronous engine for startup, placeholder)
# Note: For production with async, engines can be swapped as needed.
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    engine = None
    SessionLocal = None


def get_db() -> Generator[Session, None, None]:
    """
    Dependency helper to yield a database session.
    Closes the session after request lifecycle is complete.
    """
    if SessionLocal is None:
        logger.error("Database SessionLocal is not initialized. Yielding None.")
        raise RuntimeError("Database connection not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
