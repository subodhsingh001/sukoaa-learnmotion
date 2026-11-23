# SUKOAA Milestone 14.7 — OCR dependency diagnostics and grouped navigation

## Install safely
Back up your existing project, PostgreSQL database, and `backend/storage` or custom `SUKOAA_UPLOAD_DIR` first. Extract the ZIP over your project; do not replace `.env`, virtual environment, or uploaded PDFs.

In Windows PowerShell:

```powershell
cd C:\Users\HP\sukoaa-learnmotion\backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "import fitz, pytesseract, PIL, pypdf; print('Python OCR packages OK')"
```

Install the **Tesseract OCR Windows executable** separately and ensure `tesseract --version` works in a newly opened PowerShell terminal. If it is installed but not on PATH, configure `pytesseract.pytesseract.tesseract_cmd` with its full path in your environment/setup.

Restart backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Then restart frontend from project root:

```powershell
npm install
npm run dev
```

Log in and open `http://localhost:8000/textbooks/ocr-status` with your auth token to see the backend interpreter, installed Python OCR modules, and Tesseract PATH status. The endpoint is authenticated.

## What this patch changes
- Groups the sidebar into the requested module headings. Existing working pages are linked; unfinished modules show 'Soon' rather than navigating to broken pages. A dedicated super-admin role/dashboard is **not** implemented by this patch.
- Adds authenticated OCR dependency diagnostics.
- Makes missing Python OCR libraries / missing Tesseract failures actionable, with HTTP 503 instead of ambiguous OCR extraction errors.
- Retains previous chapter page repair and OCR extraction logic.

## What is NOT finished
- No end-to-end browser/PostgreSQL verification performed.
- No automatic AI notes/questions/animations implemented.
- The larger 14.7 chapter page-mapping and OCR robustness work still needs end-to-end testing with actual uploaded PDFs and database rows.
