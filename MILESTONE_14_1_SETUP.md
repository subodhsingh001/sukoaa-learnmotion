# SUKOAA Milestone 14.1 — Book and Chapter Workspace

This package extends the prior Milestone 14 automatic chapter detection project.

## Install on Windows

1. Back up your project folder and PostgreSQL database before merging.
2. Extract the ZIP over your existing `C:\Users\HP\sukoaa-learnmotion` project. Preserve `backend\.env`, `.venv`, your database and uploaded textbook storage (`backend\storage\textbooks` by default).
3. Start Docker PostgreSQL if needed: `docker compose up -d postgres`.
4. Start FastAPI from `backend`: `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`.
5. Start Next.js from the project root: `npm install` then `npm run dev`.
6. Open `http://localhost:3000/book-workspace`.

## Features

- Filter school books by board, class and subject.
- Browse auto-detected chapters and suggested printed page ranges.
- Verify chapter page start/end and PDF offset before extracting chapter source text. Printed page 5 might correspond to PDF page 7; enter +2 in that case.
- For an existing uploaded book, run **Auto-detect and add chapters** from `/textbooks` to populate draft chapters. If the book was detected before this update, run detection again to populate ranges for any new chapters; existing chapter ranges may need manual verification.
- Create draft notes, Q&A, quizzes, exercises, animation scripts and video descriptions as manually authored text assets; review and publish after the chapter is published.
- School admin can grant teachers permissions to upload books, edit chapters, create content and publish. Teachers can create exercises by default.
- Students only see published chapters and published assets.

## Important limitations

- This is **not** automated AI note, quiz or animation generation. Asset creation is manual until the next generation-engine milestone. A `video` asset is currently text metadata, not an MP4.
- Printed page ranges are suggestions derived from table-of-contents page numbers; the final chapter end must be set manually. The PDF offset must be verified.
- A chapter cannot be extracted if the source PDF does not contain its pages, or if the pages are scanned images without OCR.
- Current teacher exercise permissions apply school-wide; assignment to specific classrooms is future work.
- Existing application uses `Base.metadata.create_all()` as a local prototype; the three **new tables** are created at API startup, without modifying existing tables. Production requires Alembic migrations, storage hardening, and a real browser/database integration test.
- Uploads are subject to authorization and copyright permissions. Do not publish unlicensed textbook reproductions.

## API endpoints

- `GET /textbooks/my-permissions`
- `GET /textbooks/permissions/teachers` (admin)
- `PUT /textbooks/permissions/teachers/{teacher_id}` (admin)
- `GET /textbooks/{book_id}/chapter-workspace`
- `PUT /textbooks/{book_id}/chapters/{chapter_id}/pages`
- `POST /textbooks/{book_id}/chapters/{chapter_id}/extract`
- `POST /textbooks/{book_id}/chapters/{chapter_id}/assets`
- `PUT /textbooks/{book_id}/chapters/{chapter_id}/assets/{asset_id}`
