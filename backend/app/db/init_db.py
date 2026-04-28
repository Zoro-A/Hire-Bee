from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError

from app.core.config import get_settings
from app.db.database import Base, engine
from app.models import entities  # noqa: F401


def _create_database_if_missing() -> None:
    settings = get_settings()
    if not settings.auto_create_database:
        return

    db_name = settings.db_name or make_url(settings.database_url or "").database
    if not db_name:
        return

    admin_url = make_url(settings.database_url or "")
    admin_url = admin_url.set(database="postgres")

    from sqlalchemy import create_engine

    maintenance_engine = create_engine(str(admin_url), isolation_level="AUTOCOMMIT", pool_pre_ping=True)
    try:
        with maintenance_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": db_name},
            ).scalar()
            if not exists:
                safe_db_name = db_name.replace('"', '""')
                conn.execute(text(f'CREATE DATABASE "{safe_db_name}"'))
    finally:
        maintenance_engine.dispose()


def init_db() -> None:
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        message = str(exc).lower()
        if "does not exist" in message and "database" in message:
            _create_database_if_missing()
            Base.metadata.create_all(bind=engine)
            return
        raise
