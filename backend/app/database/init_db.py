import logging
from sqlalchemy.orm import Session
from app.database.session import engine
from app.database.base import Base

logger = logging.getLogger("app.database.init_db")


def init_db(db: Session) -> None:
    """
    Database initialization helper.
    Use this module to seed initial lookup values or administrator users.
    Actual tables are managed via Alembic migrations.
    """
    logger.info("Database validation connection complete.")
