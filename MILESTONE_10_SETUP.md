# Milestone 10: Backend and database foundation

This is a **local development prototype**, not a production-ready school deployment.

## Requirements
- Node.js, npm, Python 3.11+, Docker Desktop with Docker Compose.

## Terminal A: PostgreSQL
From the project root:
```powershell
docker compose up -d
```

## Terminal B: FastAPI
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```
Edit `backend/.env`: replace `JWT_SECRET` with a random 32+ character secret (PowerShell: `-join ((1..48) | ForEach-Object { 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[(Get-Random -Maximum 62)] })`). Do not commit .env.

```powershell
python seed_demo.py
uvicorn app.main:app --reload --port 8000
```
Check http://localhost:8000/docs and http://localhost:8000/health

## Terminal C: Next.js
From the project root:
```powershell
Copy-Item .env.local.example .env.local
npm install
npm run dev
```
Open http://localhost:3000/login and sign in with:
- Student: `student@demo.sukoaa.test` / `DemoOnly123!`
- Teacher: `teacher@demo.sukoaa.test` / `DemoOnly123!`
- Admin: `admin@demo.sukoaa.test` / `DemoOnly123!`

Complete a quiz as the student, then visit http://localhost:3000/my-learning. Sign out, sign in as teacher, and view the demo class summary. Progress is in PostgreSQL; browser localStorage remains as an offline visual fallback.

## Scope and safety notes
- Database tables are created using SQLAlchemy `create_all`, not migrations. Next milestone: Alembic.
- Demo accounts and passwords are for localhost only; never deploy them.
- Access tokens are stored in browser sessionStorage (prototype only). Before school deployment, move to secure HttpOnly cookies or a hardened auth provider, add rate limiting, email verification, password reset, audit logs, CSRF strategy, backup/restore and privacy controls.
- Teacher summary is school-scoped and teacher-classroom scoped. School provisioning, student invitations, class CRUD, lesson assignments and full assessment validation are not yet implemented.
- Quiz scoring currently happens in the browser and can be forged. Server-side quiz validation is required before institutional grading.
- `NEXT_PUBLIC_SUKOAA_API_URL` defaults to localhost:8000.
- Existing interactive lessons remain in the project.
