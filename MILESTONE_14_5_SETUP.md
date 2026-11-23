# SUKOAA Milestone 14.5 — Chapter data and question sets

## Install
1. Back up the project and PostgreSQL database. Extract this ZIP over the project root, preserving `.env`, `backend/.env`, the virtual environment and `backend/storage`.
2. Backend: `cd C:\Users\HP\sukoaa-learnmotion\backend` then `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`.
3. Frontend in a second PowerShell terminal: `cd C:\Users\HP\sukoaa-learnmotion` then `npm install` and `npm run dev`.
4. For textbooks uploaded before this release, open their chapter list and click **Sync titles & pages from contents** once. New textbook uploads store detected chapter start and end pages immediately.
5. Navigate directly to `/book-workspace/1/chapters/2` while signed in. Verify the chapter title and page range load without a refresh.
6. Extract a chapter with available source PDF pages. The extracted text is displayed in the Chapter Information tab.
7. Open Learning Materials, select Q&A, Quiz or Exercise, and add multiple questions to a named set.

## Notes
- This release does NOT implement AI animation/video rendering; the button is intentionally disabled. It does not claim to produce playable videos.
- Existing assets remain readable. New structured question sets are stored as JSON in the existing ChapterAsset.body column (no schema migration needed).
- For old chapters with incorrect title/page data, sync from contents. The PDF offset must be checked for books where printed and PDF pages differ.
- The final chapter's end page may require manual confirmation because the next chapter is not available to define its boundary.
- Browser/DB integration and production Next.js build have not been run here. Backend Python compilation and ZIP integrity are checked.
