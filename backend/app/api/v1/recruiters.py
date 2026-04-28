from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.entities import Recruiter, User, UserRole

router = APIRouter(prefix="/recruiters", tags=["recruiters"])


class RecruiterCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    recruiter_email: EmailStr


@router.post("/profile", status_code=status.HTTP_201_CREATED)
def create_recruiter_profile(
    payload: RecruiterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> dict:
    existing = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recruiter profile already exists")

    recruiter = Recruiter(
        user_id=current_user.id,
        company_name=payload.company_name,
        recruiter_email=payload.recruiter_email,
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)
    return {
        "id": recruiter.id,
        "user_id": recruiter.user_id,
        "company_name": recruiter.company_name,
        "recruiter_email": recruiter.recruiter_email,
    }


@router.get("/profile")
def get_recruiter_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")
    return {
        "id": recruiter.id,
        "user_id": recruiter.user_id,
        "company_name": recruiter.company_name,
        "recruiter_email": recruiter.recruiter_email,
    }
