# HireBee Backend (Phase 1)

## Run locally

1. Install dependencies:
   - `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set real values.
3. Start API:
   - `uvicorn app.main:app --reload`

## Notes

- Database tables are auto-created at startup using `Base.metadata.create_all(bind=engine)`.
- You can use either `DATABASE_URL` or `DB_HOST` + `DB_PORT` + `DB_NAME` + `DB_USER` + `DB_PASSWORD`.
- If the target database does not exist, set `AUTO_CREATE_DATABASE=true` to auto-create it on startup.
- Resume upload endpoint: `POST /api/v1/resumes/upload` (multipart file field: `file`) for PDF/DOCX.
- Optional fallback parser uses OpenAI when `OPENAI_API_KEY` is set and parser confidence is low.
- Swagger docs are available at `/docs`.
