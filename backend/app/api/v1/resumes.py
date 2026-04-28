from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.config import get_settings
from app.db.database import get_db
from app.models.entities import CandidateSkill, Resume, User, UserRole
from app.schemas.resumes import ResumeParseResponse
from app.services.resume_parser.parser import ResumeParserService
from app.services.resume_parser.skills import normalize_skill
from app.services.resume_parser.text_extractor import extract_text

router = APIRouter(prefix="/resumes", tags=["resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
parser_service = ResumeParserService()


@router.post("/upload", response_model=ResumeParseResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> ResumeParseResponse:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported.",
        )

    settings = get_settings()
    storage_dir = Path(settings.resume_storage_dir) / str(current_user.id)
    storage_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid4()}{extension}"
    file_path = storage_dir / stored_filename
    file_bytes = file.file.read()
    file_path.write_bytes(file_bytes)

    try:
        raw_text = extract_text(file_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    parse_result = parser_service.parse_resume(
        raw_text=raw_text,
        confidence_threshold=settings.parsing_confidence_threshold,
    )

    resume = Resume(
        user_id=current_user.id,
        file_name=file.filename or stored_filename,
        file_path=str(file_path),
        raw_text=raw_text,
        parsed_data=parse_result.structured_data,
        parsing_confidence=parse_result.confidence,
    )
    db.add(resume)
    db.flush()

    db.query(CandidateSkill).filter(
        CandidateSkill.user_id == current_user.id,
        CandidateSkill.source == "resume",
    ).delete(synchronize_session=False)
    extracted_skills = [normalize_skill(skill) for skill in parse_result.structured_data.get("skills", [])]
    unique_skills = sorted(set(skill for skill in extracted_skills if skill))
    for skill in unique_skills:
        db.add(
            CandidateSkill(
                user_id=current_user.id,
                skill_name=skill,
                normalized_skill=skill,
                source="resume",
            )
        )

    db.commit()
    db.refresh(resume)

    return ResumeParseResponse(
        resume_id=resume.id,
        file_name=resume.file_name,
        parsing_confidence=resume.parsing_confidence or 0.0,
        used_fallback_llm=parse_result.used_fallback_llm,
        parsed_data=resume.parsed_data,
        extracted_skills=unique_skills,
    )
