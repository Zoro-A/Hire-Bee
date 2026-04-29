import logging

from app.services.vector_store.qdrant_store import QdrantSkillStore

logger = logging.getLogger(__name__)


def init_vector_store() -> None:
    try:
        store = QdrantSkillStore()
        store.ensure_collection()
    except Exception as exc:
        # Keep API startup alive even if Qdrant is temporarily unavailable.
        logger.warning("Qdrant bootstrap skipped: %s", exc)
