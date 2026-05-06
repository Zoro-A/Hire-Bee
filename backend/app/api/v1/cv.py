from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import CVQualityEvaluation, GeneratedCV, User, UserRole
from app.schemas.cv import (
    CVResponse,
    CVTemplateResponse,
    ConversationalChatRequest,
    ConversationalChatResponse,
    ConversationalCVRequest,
    ManualCVUpsertRequest,
    SectionOrderUpdateRequest,
    SectionUpsertRequest,
)
from app.services.cv.conversation_llm import conversation_reply
from app.services.cv.exporter import CVExportService
from app.services.cv.generator import ConversationalCVGenerator
from app.services.cv.template import ATS_SECTION_LIBRARY, ATS_TEMPLATE_ID, build_empty_template, ensure_template_shape
from app.services.evaluation.cv_quality import evaluate_cv_with_gemini

router = APIRouter(prefix="/cvs", tags=["cvs"])
export_service = CVExportService()
cv_generator = ConversationalCVGenerator()


@router.get("/templates", response_model=list[CVTemplateResponse])
def get_cv_templates() -> list[dict]:
    return [
        {
            "template_id": ATS_TEMPLATE_ID,
            "name": "ATS Classic",
            "description": "Single-column ATS-friendly layout with ordered sections and optional modules.",
            "section_library": ATS_SECTION_LIBRARY,
            "default_structure": build_empty_template(),
        }
    ]


@router.post("/manual", response_model=CVResponse, status_code=status.HTTP_201_CREATED)
def create_manual_cv(
    payload: ManualCVUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> GeneratedCV:
    cv = GeneratedCV(user_id=current_user.id, title=payload.title, cv_json=ensure_template_shape(payload.cv_json))
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


@router.put("/{cv_id}", response_model=CVResponse)
def update_manual_cv(
    cv_id: int,
    payload: ManualCVUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> GeneratedCV:
    cv = db.query(GeneratedCV).filter(GeneratedCV.id == cv_id, GeneratedCV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    cv.title = payload.title
    cv.cv_json = ensure_template_shape(payload.cv_json)
    db.commit()
    db.refresh(cv)
    return cv


@router.get("", response_model=list[CVResponse])
def list_cvs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> list[GeneratedCV]:
    rows = (
        db.query(GeneratedCV)
        .filter(GeneratedCV.user_id == current_user.id)
        .order_by(GeneratedCV.created_at.desc())
        .all()
    )
    for cv in rows:
        latest = (
            db.query(CVQualityEvaluation)
            .filter(CVQualityEvaluation.cv_id == cv.id)
            .order_by(CVQualityEvaluation.created_at.desc())
            .first()
        )
        setattr(cv, "cv_quality_score", latest.overall_score if latest else None)
    return rows


@router.post("/conversation/chat", response_model=ConversationalChatResponse)
def conversational_chat(
    payload: ConversationalChatRequest,
    _current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> ConversationalChatResponse:
    try:
        reply = conversation_reply([m.model_dump() for m in payload.messages])
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    if not reply:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Empty model response")
    return ConversationalChatResponse(reply=reply)


@router.post("/conversation/generate", response_model=CVResponse, status_code=status.HTTP_201_CREATED)
def generate_conversational_cv(
    payload: ConversationalCVRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> GeneratedCV:
    if payload.messages:
        user_turns = sum(1 for m in payload.messages if m.role.lower() == "user")
        if user_turns < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Have at least two user messages in the conversation before generating a CV.",
            )
        generated_json = cv_generator.generate_from_transcript([m.model_dump() for m in payload.messages])
    else:
        generated_json = cv_generator.generate(payload.answers or {})
    cv = GeneratedCV(user_id=current_user.id, title=payload.title, cv_json=generated_json)
    db.add(cv)
    db.commit()
    db.refresh(cv)
    if payload.messages:
        try:
            score_json, model_name = evaluate_cv_with_gemini(
                messages=[m.model_dump() for m in payload.messages],
                cv_json=generated_json,
            )
            db.add(
                CVQualityEvaluation(
                    cv_id=cv.id,
                    user_id=current_user.id,
                    evaluator="gemini",
                    model_name=model_name,
                    overall_score=float(score_json.get("overall", 0.0)),
                    faithfulness_score=float(score_json.get("faithfulness", 0.0)),
                    relevance_score=float(score_json.get("relevance", 0.0)),
                    professionalism_score=float(score_json.get("professionalism", 0.0)),
                    completeness_score=float(score_json.get("completeness", 0.0)),
                    impact_score=float(score_json.get("impact", 0.0)),
                    strengths=list(score_json.get("strengths", [])),
                    weaknesses=list(score_json.get("weaknesses", [])),
                    recommendations=list(score_json.get("recommendations", [])),
                    transcript_json=[m.model_dump() for m in payload.messages],
                )
            )
            db.commit()
            setattr(cv, "cv_quality_score", float(score_json.get("overall", 0.0)))
        except Exception:
            # CV generation should remain available even if judge model is unavailable.
            setattr(cv, "cv_quality_score", None)
    return cv


@router.patch("/{cv_id}/section-order", response_model=CVResponse)
def update_cv_section_order(
    cv_id: int,
    payload: SectionOrderUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> GeneratedCV:
    cv = db.query(GeneratedCV).filter(GeneratedCV.id == cv_id, GeneratedCV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    normalized = ensure_template_shape(cv.cv_json)
    available = set(normalized["sections"].keys())
    requested = [section for section in payload.section_order if section in available]
    missing = [section for section in normalized["section_order"] if section not in requested]
    normalized["section_order"] = requested + missing
    cv.cv_json = normalized
    db.commit()
    db.refresh(cv)
    return cv


@router.patch("/{cv_id}/sections", response_model=CVResponse)
def upsert_cv_section(
    cv_id: int,
    payload: SectionUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> GeneratedCV:
    cv = db.query(GeneratedCV).filter(GeneratedCV.id == cv_id, GeneratedCV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    normalized = ensure_template_shape(cv.cv_json)
    section_key = payload.section_key.strip().lower().replace(" ", "_")
    normalized["sections"][section_key] = payload.content
    if section_key not in normalized["section_order"]:
        normalized["section_order"].append(section_key)
    if payload.label:
        normalized.setdefault("section_labels", {})
        normalized["section_labels"][section_key] = payload.label
    cv.cv_json = normalized
    db.commit()
    db.refresh(cv)
    return cv


@router.post("/{cv_id}/export", response_model=CVResponse)
def export_cv(
    cv_id: int,
    export_format: str = Query(..., pattern="^(pdf|docx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> GeneratedCV:
    cv = db.query(GeneratedCV).filter(GeneratedCV.id == cv_id, GeneratedCV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")

    try:
        if export_format == "pdf":
            cv.pdf_path = export_service.export_pdf(current_user.id, cv.id, cv.title, cv.cv_json)
        else:
            cv.docx_path = export_service.export_docx(current_user.id, cv.id, cv.title, cv.cv_json)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    db.commit()
    db.refresh(cv)
    return cv


@router.get("/{cv_id}/download")
def download_cv_export(
    cv_id: int,
    export_format: str = Query(..., pattern="^(pdf|docx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> FileResponse:
    """Serve the generated export for the CV owner. Path is derived server-side from user id and cv id."""
    settings = get_settings()
    cv = db.query(GeneratedCV).filter(GeneratedCV.id == cv_id, GeneratedCV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")

    ext = "pdf" if export_format == "pdf" else "docx"
    folder = "pdf" if export_format == "pdf" else "docx"
    base = Path(settings.generated_assets_dir).resolve()
    file_path = (Path(settings.generated_assets_dir) / folder / str(current_user.id) / f"cv_{cv_id}.{ext}").resolve()

    try:
        file_path.relative_to(base)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid export path") from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {ext.upper()} file yet. Export this CV first.",
        )

    raw_title = (cv.title or "cv").strip() or "cv"
    safe_name = "".join(ch for ch in raw_title if ch.isalnum() or ch in " -_")[:80] or "cv"
    filename = f"{safe_name}_{cv_id}.{ext}"
    media = (
        "application/pdf"
        if ext == "pdf"
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    return FileResponse(path=file_path, filename=filename, media_type=media)
