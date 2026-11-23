# Milestone 14 — School Book Library (MVP)

This release extends Milestone 13 without replacing existing lesson, assessment, school, or curriculum routes.

## Install

Back up your project and database. Merge files into `C:\Users\HP\sukoaa-learnmotion`. Preserve `backend\.env`, `.venv`, and existing PostgreSQL volumes. Install backend additions:

```powershell
cd C:\Users\HP\sukoaa-learnmotion\backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

In another PowerShell window:

```powershell
cd C:\Users\HP\sukoaa-learnmotion
npm install
npm run dev
```

Visit `http://localhost:3000/textbooks` and `http://localhost:8000/docs`.

## Capabilities and limitations

- Teachers/admins can upload up to 20 MB PDF, select school board/class/subject/edition and confirm rights.
- Text-based PDFs are extracted with pypdf; scanned image-only PDFs are marked `needs_ocr`. **OCR is not implemented.**
- Suggested chapter headings use a simple regular expression and require manual review; no LLM is connected.
- Teachers/admins can create chapters; teachers mark them reviewed; admins publish.
- Students only see published chapter metadata and text in their school. Uploaded PDFs and extraction previews are not publicly served.
- Existing database rows are retained; `Base.metadata.create_all` creates new tables in local development. Use migrations before production.
- Uploaded PDFs are saved in `backend/storage/textbooks/<school_id>/` by default. This directory is **not** inside the ZIP; back it up separately. For production, use protected object storage, malware scanning, quotas and async processing.
- No AI notes, generated quizzes, narration, animations or videos are claimed in this milestone.

## Quick validation

1. Sign in as admin and upload a permitted text PDF.
2. Confirm its extraction status and preview, then create a chapter.
3. Mark the chapter reviewed; publish it as admin.
4. Sign in as student and verify only published chapters appear.
5. Test two schools with separate accounts; neither should see the other's books.
6. Upload an image-only PDF and confirm it is marked `needs_ocr` rather than fabricating extracted text.

## Security notes

The upload endpoint verifies the PDF header and enforces size limits, but this is a prototype and not a production-safe untrusted-document processing service. Restrict uploads to trusted schools until malware scanning, sandboxed parsing, request rate limits and resource quotas are added. Teacher access is school-scoped, not yet restricted to assigned classes.
