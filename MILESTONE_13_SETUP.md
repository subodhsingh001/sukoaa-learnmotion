# SUKOAA Milestone 13 — Board-aware curriculum foundation

## Implemented
- Class 1–12 curriculum browser at `/curriculum`.
- Board selector: CBSE/NCERT and ICSE/ISC (ISC for senior secondary).
- Subject navigation, chapter search, content readiness badges and links to four existing interactive lessons.
- Read-only FastAPI endpoints: `GET /curriculum/boards` and `GET /curriculum/chapters?board=CBSE%2FNCERT&class_level=6`.
- Existing lesson, assessment, login, school and progress routes remain in place.
- Starter curriculum data in `data/curriculum.json` and `backend/app/curriculum_catalog.json`.

## Scope warning
This milestone delivers the **curriculum structure and starter topic map**, not a complete verified official syllabus or hundreds of finished animation videos. Chapter lists are illustrative and must be reconciled against current NCERT and CISCE publications. Classes 11–12 include cross-stream subjects for discovery; they are not student-specific subject enrollment. No new animation/video content is claimed as completed.

## Install
1. Back up the working project. Extract the ZIP into your project directory, retaining your local `backend/.env`, `.venv`, and PostgreSQL volume.
2. From project root: `npm install`, then `npm run dev`.
3. From `backend`: `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`.
4. Visit `http://localhost:3000/curriculum` and verify both boards and classes 1–12.
5. Visit `http://localhost:8000/docs` for the new curriculum endpoints.

## Next content production
Validate official board-year-specific syllabi and subject streams; then create chapter lesson assets, original animation scenes, narration, captions, quizzes and publishable completion statuses. Add curriculum persistence/migrations and teacher assignment in later milestones.
