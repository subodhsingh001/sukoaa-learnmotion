# SUKOAA Milestone 12 — Assessments and reporting

## Installation
Back up your current project and merge the package into the existing project root. Keep `backend/.env`, `.venv`, and PostgreSQL Docker volumes. The new `quiz_attempts` table is created by the current FastAPI startup `Base.metadata.create_all`; existing tables are not deleted. For production, use Alembic migrations.

1. Start Docker PostgreSQL on the configured host port `15432`.
2. In `backend`, run `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`.
3. In the project root run `npm install` and `npm run dev`.
4. Log in as student, complete a quiz, then visit `/my-learning` for attempt history.
5. Log in as teacher/admin, visit `/reports`, select a classroom, and verify student attempts, average score and lesson completion.

## API
- `GET /assessments/quizzes/{slug}` returns public quiz questions without correct answers.
- `POST /assessments/quizzes/{slug}/submit` grades answers on server and stores immutable attempts (student only).
- `GET /assessments/me/attempts` shows the authenticated user's latest 100 attempts.
- `GET /assessments/classrooms/{id}/report` is restricted to school admin or assigned teacher.

## Important notes
- The original `/progress/{slug}` endpoint still allows marking a lesson complete without a quiz; it no longer accepts arbitrary score values. Quiz scores must use the assessment submission endpoint.
- Quiz questions remain in the frontend for interactive feedback, while a matching answer key is maintained on the server. Update both together when editing a quiz. For production, move quiz content to database-backed versioned questions.
- This milestone has no automatic data deletion. Do not run `docker compose down -v`.
- Development verification is not equivalent to production security audit.
