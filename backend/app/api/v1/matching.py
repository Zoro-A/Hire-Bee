from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import User, UserRole
from app.schemas.matching import MatchedJobResponse
from app.services.matching.skill_matcher import SkillMatcherService

router = APIRouter(prefix="/matching", tags=["matching"])
matcher_service = SkillMatcherService()


@router.get("/jobs-for-me", response_model=list[MatchedJobResponse])
def jobs_for_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> list[dict]:
    return matcher_service.match_jobs_for_candidate(db=db, user_id=current_user.id)
