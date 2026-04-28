from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import Recruiter, User, UserRole
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/recruiters")
def list_recruiters(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[dict]:
    recruiters = db.query(Recruiter).order_by(Recruiter.created_at.desc()).all()
    return [
        {
            "id": recruiter.id,
            "user_id": recruiter.user_id,
            "company_name": recruiter.company_name,
            "recruiter_email": recruiter.recruiter_email,
        }
        for recruiter in recruiters
    ]
