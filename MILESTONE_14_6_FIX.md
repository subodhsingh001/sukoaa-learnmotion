# SUKOAA 14.6: Chapter page repair and scanned-PDF OCR

## Fixes
- On loading a book's chapter workspace, missing chapter start-page records are recovered from the uploaded PDF table of contents and persisted for that school. Existing valid page ranges are not overwritten.
- Page edits now reject missing start/end pages and reversed ranges instead of silently saving null.
- Extract chapter text reads ordinary PDF text, and automatically attempts OCR on image-only pages. OCR output is shown through the existing Extract & preview chapter button.
- Existing multiple Q&A/quiz/exercise sets remain supported. Automatic question/answer generation and animation/video rendering are **not** included.

## Install on Windows PowerShell
1. Back up the existing project and database. Merge this ZIP into `C:\Users\HP\sukoaa-learnmotion`, preserving backend `.env`, virtualenv, PostgreSQL and uploaded PDFs (`backend/storage/textbooks` if using default storage).
2. Install requirements:
   `cd C:\Users\HP\sukoaa-learnmotion\backend`
   `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
3. Install Tesseract OCR for Windows separately (the Python package does not install the OCR executable). Add the Tesseract installation directory to your Windows PATH and confirm `tesseract --version` in a NEW PowerShell window.
4. Restart FastAPI and Next.js. Navigate to `/book-workspace/1/chapters/2` and verify Chapter 2 is pages 9–14. Chapter 3 is pages 15–19; click `Extract & preview chapter` on Chapter 3 to test OCR.
5. If pages still display blank, verify that the running FastAPI server uses the updated code and that the original uploaded PDF still exists at its configured storage path.

## Verification
- Python compilation passed.
- Tested the supplied book PDF: contents on PDF page 4 identifies Chapter 2 pages 9–14, Chapter 3 pages 15–19. PDF pages 15–19 have no text layer.
- Local Tesseract OCR recovered text including review questions from PDF page 18.
- Not tested against the user's running PostgreSQL database or Windows browser.
