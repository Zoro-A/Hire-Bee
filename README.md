# Hire-Bee

## Dummy Login Credentials

All seeded users share the same password: `SeedDemo123!`

### Job Seekers
- Email pattern: `seed-seeker-01@example.com` through `seed-seeker-20@example.com`
- Password: `SeedDemo123!`

### Recruiters
- Email pattern: `seed-recruiter-01@example.com` through `seed-recruiter-20@example.com`
- Password: `SeedDemo123!`

### Example Logins
| Role      | Email                          | Password       |
|-----------|--------------------------------|----------------|
| Seeker    | seed-seeker-01@example.com     | SeedDemo123!   |
| Recruiter | seed-recruiter-01@example.com  | SeedDemo123!   |

## Seeding the Database

```bash
cd backend
python -m app.db.seed_demo
```

## Running the Project

### Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

### Backend (http://localhost:8000)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Required Services
- PostgreSQL (configure in `backend/.env`)
- Qdrant: `docker run -p 6333:6333 qdrant/qdrant`
