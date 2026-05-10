# HireBee Backend

## First-time setup

1. **Python** — Use Python 3.11+ (3.13 works if your stack is already on it). Create a virtual environment if you like, then install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. **Environment file** — Copy the example env and edit values:

   ```bash
   copy .env.example .env
   ```

   On Unix: `cp .env.example .env`

   Fill in at least **database** and **`SECRET_KEY`** (see [Configuration](#configuration)). Other blocks are optional depending on which features you use.

3. **PostgreSQL** — Create an empty database matching `DB_NAME` (or rely on `AUTO_CREATE_DATABASE=true` if your server user may create databases). Tables are created at API startup via `Base.metadata.create_all`.

4. **Qdrant** (skill matching) — Run locally, for example:

   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

   Point `QDRANT_URL` at that instance. The first embedding/index calls may download the sentence-transformers model (`EMBEDDING_MODEL_NAME`); ensure the machine has disk and (optional) GPU as you prefer.

5. **Storage directories** — Defaults `storage/resumes` and `storage/generated` are relative to the process working directory. Run `uvicorn` from the `backend` folder so paths resolve, or set `RESUME_STORAGE_DIR` / `GENERATED_ASSETS_DIR` to absolute paths.

6. **Start the API** (from the `backend` directory):

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

7. **Smoke check** — Open `http://127.0.0.1:8000/docs` (or your host/port). Register a user via `POST /api/v1/auth/register`, then call protected routes with `Authorization: Bearer <token>`.

8. **Optional — load demo fixtures** — If you want pre-built users, jobs, matches, and applications for UI testing, follow [Demo data seed](#demo-data-seed) after Postgres (and ideally Qdrant) are working.

## Demo data seed

Use this when you want realistic rows without clicking through every flow first.

### Prerequisites

- **`.env`** is filled out and **Postgres** is reachable (same settings the API uses).
- **Qdrant** is running at `QDRANT_URL` if you want job skills indexed for matching; indexing failures are swallowed, but matching is more useful with Qdrant up.
- Run commands from the **`backend`** directory so imports and paths resolve.

### Run the seeder

```bash
python -m app.db.seed_demo
```

### What it creates

- **40 users**: `seed-seeker-01@example.com` … `seed-seeker-20@example.com` (job seekers) and `seed-recruiter-01@example.com` … `seed-recruiter-20@example.com` (recruiters).
- **20 recruiters**, **20 jobs** (with skills), **20 resumes**, **20 generated CVs**, **20 cover letters**, **20 applications** (with match fields), **20 interview schedules**, plus per-seeker **candidate skills** aligned with the demo jobs.
- **Email** log rows whose subject starts with `[HireBee seed demo]` are cleared on re-seed.

### Demo logins

All seeded users share the same password:

| Role | Example email | Password |
|------|-----------------|----------|
| Job seeker | `seed-seeker-01@example.com` | `SeedDemo123!` |
| Recruiter | `seed-recruiter-01@example.com` | `SeedDemo123!` |

Use `POST /api/v1/auth/login` with that email and password to obtain a JWT. Recruiter-only routes (e.g. applicant list, interview schedule) require a recruiter account.

### Re-running

The script **deletes prior seed rows** (matched by seed email patterns and the demo email subject prefix), then inserts a fresh dataset. Safe for local dev; **do not run against production** databases.

Implementation details and edge cases live in `app/db/seed_demo.py`.

## Configuration

Values load from `.env` (see `.env.example` for the full list). Names are case-insensitive.

### Required for a minimal run

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | JWT signing; use a long random string in any real deployment. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection (unless you set `DATABASE_URL` instead). |
| `DB_HOST`, `DB_PORT` | Defaults suit local Postgres. |

Alternatively set **`DATABASE_URL`** and leave the split `DB_*` fields unused.

### CORS and frontend

| Variable | Purpose |
|----------|---------|
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (e.g. Vite on `http://localhost:5173`). |
| `FRONTEND_BASE_URL` | Used in password-reset emails and similar links. |

### OpenAI (CV JSON, cover letters, resume parsing fallback, conversational CV when using OpenAI)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | If unset, some LLM features degrade or use fallbacks; set for production-quality parsing and generation. |
| `OPENAI_MODEL` | Chat/completions model id (default in example: `gpt-4.1-mini`). |

### Conversational CV (chat vs JSON)

| Variable | Purpose |
|----------|---------|
| `CONVERSATION_LLM_PROVIDER` | `openai` (uses `OPENAI_*`) or `ollama` for local chat only. |
| `OLLAMA_BASE_URL` | Ollama HTTP API base (default `http://127.0.0.1:11434`). |
| `OLLAMA_CHAT_MODEL` | Exact tag from `ollama list` (example: `llama3.2:1b`). Must match what you pulled; mismatches cause 503. |
| `OLLAMA_CHAT_NUM_CTX`, `OLLAMA_CHAT_NUM_PREDICT`, `OLLAMA_CHAT_NUM_GPU` | Optional. Sent to Ollama’s `/api/chat` to cap context and tokens; set `OLLAMA_CHAT_NUM_GPU=0` in **HireBee’s** `.env` to request CPU inference when the GPU runner crashes. |
| `CV_JSON_LLM_PROVIDER` | `openai` or `qwen_local` for structured CV JSON from transcript. |
| `QWEN_LOCAL_ADAPTER_PATH` | Local folder containing LoRA adapter files (`adapter_model.safetensors`, `adapter_config.json`, tokenizer files). |
| `QWEN_LOCAL_BASE_MODEL` | Base model id for the adapter (e.g. `Qwen/Qwen2.5-3B-Instruct`). |
| `QWEN_LOCAL_DEVICE` | `auto` (GPU if available) or `cpu`. |
| `QWEN_LOCAL_MAX_NEW_TOKENS`, `QWEN_LOCAL_TEMPERATURE` | Generation tuning for local Qwen JSON output. |

With **`CONVERSATION_LLM_PROVIDER=ollama`**, install [Ollama](https://ollama.com), run `ollama pull <OLLAMA_CHAT_MODEL>`, and keep the daemon running. The API tries Ollama’s **`/api/chat`** first, then **`/v1/chat/completions`** if the first call fails (useful when the interactive `ollama run` session works but HTTP chat was flaky). Close long-running `ollama run` sessions before heavy browser use so the server is not starved.

For local fine-tuned Qwen CV JSON generation:

1. Install dependencies: `pip install -r requirements.txt`
2. Set:
   - `CV_JSON_LLM_PROVIDER=qwen_local`
   - `QWEN_LOCAL_ADAPTER_PATH=<absolute folder path containing adapter files>`
   - `QWEN_LOCAL_BASE_MODEL=Qwen/Qwen2.5-3B-Instruct`
3. Restart backend.

Note: adapter files are LoRA deltas, so the base model must be downloadable/available locally.

**If `ollama run <model>` itself returns 500** (`llama runner process has terminated`), the problem is Ollama on your machine, not HireBee. Try in order: update Ollama and GPU drivers; `ollama pull llama3.2:1b` and `ollama run llama3.2:1b` (smaller weights); read `%LOCALAPPDATA%\Ollama\server.log` with debug on ([Ollama troubleshooting](https://docs.ollama.com/troubleshooting)). Quit Ollama from the tray, then start it from PowerShell with **`OLLAMA_LLM_LIBRARY=cpu_avx2`** (or `cpu`) to bypass broken GPU autodetection, for example:

```powershell
$env:OLLAMA_LLM_LIBRARY="cpu_avx2"
$env:OLLAMA_DEBUG="1"
& "$env:LOCALAPPDATA\Programs\Ollama\ollama app.exe"
```

Until Ollama runs successfully in a terminal, use **`CONVERSATION_LLM_PROVIDER=openai`** and an **`OPENAI_API_KEY`** for conversational chat.

### Qdrant and matching

| Variable | Purpose |
|----------|---------|
| `QDRANT_URL`, `QDRANT_API_KEY` | Vector store for job skill indexing and semantic match fallback. |
| `QDRANT_COLLECTION_NAME` | Collection name (default `job_skills`). |
| `EMBEDDING_MODEL_NAME`, `EMBEDDING_VECTOR_SIZE` | Must stay consistent with the chosen model (default BGE small, 384 dims). |
| `MATCHING_SCORE_THRESHOLD`, `MATCHING_TOP_K` | Heuristic filters for `GET /api/v1/matching/jobs-for-me`. |
| `QDRANT_SAFE_UPSERT` | Safer upsert behaviour for job skill points. |

### Email (applications, interviews, password reset)

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USE_TLS` | Outbound mail transport. |
| `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` | If unset, auth password-reset and application/interview mail steps no-op or skip sending where implemented. |

### Google sign-in

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | If unset, `POST /api/v1/auth/google` returns 503 until configured. |

### Paths and tuning

| Variable | Purpose |
|----------|---------|
| `RESUME_STORAGE_DIR` | Uploaded resume files. |
| `GENERATED_ASSETS_DIR` | Exported CV PDF/DOCX output. |
| `PARSING_CONFIDENCE_THRESHOLD` | When to lean on OpenAI-assisted parsing if configured. |
| `AUTO_CREATE_DATABASE` | When `true`, startup may create the Postgres database if missing. |

## API notes

- Database tables are auto-created at startup using `Base.metadata.create_all(bind=engine)`.
- Resume upload: `POST /api/v1/resumes/upload` (multipart field `file`) for PDF/DOCX.
- Optional resume parsing uses OpenAI when `OPENAI_API_KEY` is set and parser confidence is low.
- Skill matching: local Qdrant + embeddings; recruiter job flows index skills; candidates use `GET /api/v1/matching/jobs-for-me`.
- CV endpoints:
  - `GET /api/v1/cvs/templates`
  - Manual CRUD under `/api/v1/cvs`, section order `PATCH /api/v1/cvs/{cv_id}/section-order`, sections `PATCH /api/v1/cvs/{cv_id}/sections`
  - Conversational coach: `POST /api/v1/cvs/conversation/chat`
  - Conversational CV create: `POST /api/v1/cvs/conversation/generate`
  - Export: `POST /api/v1/cvs/{cv_id}/export?export_format=pdf|docx`
  - Download file: `GET /api/v1/cvs/{cv_id}/download?export_format=pdf|docx` (after export)
- Cover letters: `POST /api/v1/cover-letters/generate`, list `GET /api/v1/cover-letters`, edit `PATCH /api/v1/cover-letters/{cover_letter_id}`
- Applications: `POST /api/v1/applications`, `GET /api/v1/applications/me`, recruiter list `GET /api/v1/applications/recruiter`, status `PATCH /api/v1/applications/{application_id}/status`
- Interviews: `POST /api/v1/interviews/schedule`, list `GET /api/v1/interviews/recruiter`
- Email logs: `GET /api/v1/emails/logs` (admin/recruiter)
- Interactive docs: `/docs`
