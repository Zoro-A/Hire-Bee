from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import Email, User, UserRole
from app.schemas.emails import EmailLogResponse

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("/logs", response_model=list[EmailLogResponse])
def get_email_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.RECRUITER)),
) -> list[Email]:
    return db.query(Email).order_by(Email.created_at.desc()).all()
