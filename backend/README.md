# HireBee Backend (Phase 1)

## Run locally

1. Install dependencies:
   - `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set real values.
3. Start Qdrant locally (Docker):
   - `docker run -p 6333:6333 qdrant/qdrant`
4. Start API:
   - `uvicorn app.main:app --reload`

## Notes

- Database tables are auto-created at startup using `Base.metadata.create_all(bind=engine)`.
- You can use either `DATABASE_URL` or `DB_HOST` + `DB_PORT` + `DB_NAME` + `DB_USER` + `DB_PASSWORD`.
- If the target database does not exist, set `AUTO_CREATE_DATABASE=true` to auto-create it on startup.
- Resume upload endpoint: `POST /api/v1/resumes/upload` (multipart file field: `file`) for PDF/DOCX.
- Optional fallback parser uses OpenAI when `OPENAI_API_KEY` is set and parser confidence is low.
- Skill matching uses local Qdrant + `BAAI/bge-small-en-v1.5` embeddings:
  - App startup will create/use the Qdrant collection from your configured `QDRANT_*` env values.
  - Recruiter job creation indexes required skills in Qdrant.
  - Candidate matching endpoint: `GET /api/v1/matching/jobs-for-me`.
  - `QDRANT_SAFE_UPSERT=true` keeps existing vectors safe and uses deterministic point IDs per `job_id+skill`.
- CV endpoints:
  - Template metadata for FlowCV-style frontend builder: `GET /api/v1/cvs/templates`
  - Manual builder save/update/list: `/api/v1/cvs`
  - Reorder sections: `PATCH /api/v1/cvs/{cv_id}/section-order`
  - Add/update custom sections (e.g., extracurricular): `PATCH /api/v1/cvs/{cv_id}/sections`
  - Conversational generation: `POST /api/v1/cvs/conversation/generate`
  - Export: `POST /api/v1/cvs/{cv_id}/export?export_format=pdf|docx`
- Cover letter endpoints:
  - Generate: `POST /api/v1/cover-letters/generate`
  - List: `GET /api/v1/cover-letters`
- Swagger docs are available at `/docs`.
