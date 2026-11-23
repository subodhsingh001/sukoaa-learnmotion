# SUKOAA Milestone 14.3 — Book listing and chapter detail

## Changes
- `/book-workspace`: filterable, searchable and paginated book table; board, book, subject, class and actions.
- `/book-workspace/[bookId]`: paginated chapter table and source availability.
- `/book-workspace/[bookId]/chapters/[chapterId]`: three-column learning material categories; edit chapter information; verify page range; extract text; create/edit/review/publish materials.
- `/school-admin/teachers`: teacher listing with assigned classroom and book/content permissions.
- Backend: edit book metadata, conservative delete (blocked when chapters exist), clearer extraction errors, default PDF offset 0, and invalidate extracted content when page mapping changes.

## Install
Back up project and database. Extract this ZIP over the existing project without replacing your `.env`, upload storage, or database volume. From project root run `npm install`, then `npm run dev`. From backend run `.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt` and `.\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000`.

## Important limits
- Teacher subject assignments are not yet modeled in the database. The teacher table shows existing classroom assignments and explicitly labels subject as not configured.
- Delete is intentionally refused for books with chapters, to protect content and learning history. Archive/soft-delete requires a future migration.
- The chapter PDF extractor supports text-layer PDFs, not scanned image-only PDFs. A chapter outside the uploaded PDF cannot be extracted.
- AI generation and playable videos are not implemented here.
- End-to-end browser/PostgreSQL validation is still required on the user's environment.
