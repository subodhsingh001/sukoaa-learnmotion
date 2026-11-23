# Milestone 11 — School Management and Teacher Dashboard

## Included
- School-admin page at `/school-admin`: create student/teacher accounts, create classrooms, assign teachers, enroll/unenroll students, view users.
- Teacher page at `/teacher`: classroom-scoped student progress.
- FastAPI `/school/*` routes with admin-only writes and school/teacher scoping.
- Existing 3D lessons, authentication, progress API, and student pages retained.

## Upgrade existing Milestone 10 installation (Windows PowerShell)
1. **Back up your project and PostgreSQL database first.** This ZIP does not contain `.env`, `.env.local`, Python virtual environments, or `node_modules`. Preserve your local configuration files.
2. Merge these files into your existing project. Do not delete `backend/.env` or overwrite your Docker volume.
3. Keep Docker's host port `15432` in `docker-compose.yml` if ports 5432/5433 are used by your installed PostgreSQL services. Keep `backend/.env` `DATABASE_URL` pointed to port `15432` with the correct password.
4. `docker compose up -d postgres`
5. `cd backend; .\.venv\Scripts\python.exe -m pip install -r requirements.txt; .\.venv\Scripts\python.exe seed_demo.py`
6. ` .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`
7. In another terminal at the project root: `npm install; npm run dev`
8. Sign in with `admin@example.com` to access `/school-admin`, or `teacher@example.com` to access `/teacher` (local demo only).

## Security notes
- This is a **development milestone**, not a production-ready school platform. Password-based demo accounts must be removed before deployment.
- The API validates role and school scope for all school management operations. Teachers only access assigned classrooms; students cannot access these endpoints.
- School account creation accepts a temporary password for prototyping. Production needs invitations, password resets, audit logs, rate limiting, and migration tooling.
- Frontend navigation is not a security boundary; API permissions are authoritative.
- SQLAlchemy `create_all` adds new tables but is **not a migration system**. Existing Milestone 10 schema is reused without destructive changes. Add Alembic migrations before production.
