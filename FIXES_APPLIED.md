# Fixes applied

- Fixed TypeScript prop mismatches for animals/insects and removed unreachable lesson topic branches.
- Fixed PDF.js render parameters and bundled worker URL resolution.
- Added authenticated, school-isolated PDF endpoint at `GET /textbooks/{book_id}/pdf` (students require a published chapter).
- Added **Read Book** links in book workspace and chapter pages.
- Uploading a textbook now opens the PDF reader directly; the reader has a link back to chapter management.
- Improved flip animation timing to 1150 ms and stopped intercepting mouse wheel page scrolling.
- Added fullscreen state tracking and an exit control.
- Improved narration cancellation on page changes, pause/resume/stop, and OCR-free PDF viewing.
- OCR remains optional for reading; scanned PDFs without selectable text cannot be narrated until OCR is installed.

## Validation
Python syntax compilation of backend route passed. Full Next.js build could not be verified in this environment because npm dependency installation timed out. Run `npm ci` and `npm run build` locally before pushing.

## Security
Local backend `.env` files and virtual environments are omitted from this archive. Do not commit credentials.
