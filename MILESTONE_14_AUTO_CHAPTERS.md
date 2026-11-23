# Milestone 14 update: automatic chapter creation

- New uploads with a readable, numbered contents page automatically create chapter drafts.
- Previously uploaded books: open Textbooks, select the book, click **Auto-detect and add chapters**.
- Review the detected chapter titles, click **Approve all draft chapter titles**, then an admin can **Publish all reviewed chapters**.
- Existing chapters are not duplicated by chapter number.
- Verified against the supplied Gurukul's Environmental Studies 2 sample: all 20 table-of-contents chapter titles detected.
- Only a partial book was supplied (first 60 PDF pages); later chapters are indexed from the contents page, but their actual chapter text is not present.
- This is deterministic contents-page parsing, not AI notes, OCR, or video creation. Scanned PDFs without text require OCR. Not all textbook TOC formats will match.
- Run backend dependencies and restart FastAPI and Next.js. No new database migration is required.
- Full browser/database integration tests have not been run in this environment.
